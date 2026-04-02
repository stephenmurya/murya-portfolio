import { spawn } from "node:child_process";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const url = process.argv[2];
const outputDirArg = process.argv[3];

if (!url || !outputDirArg) {
  console.error("Usage: node scripts/extract-site.mjs <url> <output-dir>");
  process.exit(1);
}

const outputDir = path.resolve(outputDirArg);

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const desktopViewport = {
  width: 1440,
  height: 1100,
  mobile: false,
  deviceScaleFactor: 1,
};

const mobileViewport = {
  width: 390,
  height: 844,
  mobile: true,
  deviceScaleFactor: 2,
};

function normalizeFileUrl(input) {
  return input.replace(/\\/g, "/");
}

async function pathExists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function findBrowser() {
  for (const candidate of browserCandidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("No supported browser executable found.");
}

async function fetchJson(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Request failed: ${endpoint} (${response.status})`);
  }

  return response.json();
}

async function waitForDebugger(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/list`);
    } catch {
      await delay(200);
    }
  }

  throw new Error("Timed out waiting for Chrome DevTools Protocol.");
}

class CdpSession {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data.toString());

      if (payload.id) {
        const pending = this.pending.get(payload.id);
        if (!pending) {
          return;
        }

        this.pending.delete(payload.id);

        if (payload.error) {
          pending.reject(new Error(payload.error.message));
          return;
        }

        pending.resolve(payload.result);
        return;
      }

      if (payload.method) {
        const waiters = this.eventWaiters.get(payload.method);
        if (!waiters || waiters.length === 0) {
          return;
        }

        const next = waiters.shift();
        next(payload.params ?? {});
      }
    });
  }

  async close() {
    if (!this.socket) {
      return;
    }

    this.socket.close();
    await delay(100);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method) {
    return new Promise((resolve) => {
      const existing = this.eventWaiters.get(method) ?? [];
      existing.push(resolve);
      this.eventWaiters.set(method, existing);
    });
  }
}

async function configurePage(session, viewport) {
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  await session.send("Network.enable");
  await session.send("DOM.enable");
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    mobile: viewport.mobile,
    deviceScaleFactor: viewport.deviceScaleFactor,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
}

async function navigate(session, targetUrl) {
  const loadEvent = session.waitForEvent("Page.loadEventFired");
  await session.send("Page.navigate", { url: targetUrl });
  await loadEvent;
  await delay(1500);
}

async function evaluate(session, expression) {
  const result = await session.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return result.result?.value;
}

async function autoscroll(session) {
  await evaluate(
    session,
    `(() => new Promise((resolve) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      let current = 0;
      const step = Math.max(320, Math.floor(window.innerHeight * 0.7));

      function tick() {
        window.scrollTo({ top: current, behavior: "instant" });
        current += step;

        if (current >= max) {
          window.scrollTo({ top: max, behavior: "instant" });
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
            setTimeout(resolve, 300);
          }, 400);
          return;
        }

        setTimeout(tick, 200);
      }

      tick();
    }))()`
  );
}

async function getDocumentHtml(session) {
  return evaluate(
    session,
    "document.documentElement.outerHTML"
  );
}

async function getPageSummary(session) {
  return evaluate(
    session,
    `(() => {
      const styleProps = [
        "display",
        "position",
        "backgroundColor",
        "color",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "padding",
        "margin",
        "borderRadius",
        "gap",
        "alignItems",
        "justifyContent",
        "opacity",
        "transition",
        "transform"
      ];

      const bodyStyles = getComputedStyle(document.body);
      const cssTokens = Object.keys(bodyStyles)
        .filter((key) => key.startsWith("--token-"))
        .sort()
        .reduce((acc, key) => {
          acc[key] = bodyStyles.getPropertyValue(key).trim();
          return acc;
        }, {});

      const textNodes = [...document.querySelectorAll('[data-framer-component-type="RichTextContainer"], h1, h2, h3, h4, h5, h6, p')]
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const text = (el.textContent || "").replace(/\\s+/g, " ").trim();
          if (!text) return null;
          if (rect.width < 20 || rect.height < 10) return null;

          const styles = getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(),
            text,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            styles: {
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              lineHeight: styles.lineHeight,
              letterSpacing: styles.letterSpacing,
              color: styles.color,
              textAlign: styles.textAlign
            }
          };
        })
        .filter(Boolean)
        .slice(0, 200);

      const sectionCandidates = [...document.querySelectorAll("[data-framer-name]")]
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const styles = getComputedStyle(el);
          const text = (el.textContent || "").replace(/\\s+/g, " ").trim();

          if (rect.width < window.innerWidth * 0.45) return null;
          if (rect.height < 80) return null;

          return {
            name: el.getAttribute("data-framer-name"),
            tag: el.tagName.toLowerCase(),
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            textPreview: text.slice(0, 220),
            styles: styleProps.reduce((acc, prop) => {
              acc[prop] = styles[prop];
              return acc;
            }, {})
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.top - b.top)
        .slice(0, 60);

      const images = [...document.querySelectorAll("img")]
        .map((img) => {
          const rect = img.getBoundingClientRect();
          return {
            src: img.currentSrc || img.src,
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height)
          };
        })
        .filter((image) => image.src);

      const backgrounds = [...document.querySelectorAll("*")]
        .map((el) => {
          const styles = getComputedStyle(el);
          const backgroundImage = styles.backgroundImage;
          if (!backgroundImage || backgroundImage === "none") {
            return null;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width < 40 || rect.height < 40) {
            return null;
          }

          return {
            name: el.getAttribute("data-framer-name") || el.tagName.toLowerCase(),
            backgroundImage,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
        .filter(Boolean)
        .slice(0, 120);

      const links = [...document.querySelectorAll("a[href]")]
        .map((anchor) => ({
          href: anchor.href,
          text: (anchor.textContent || "").replace(/\\s+/g, " ").trim(),
          ariaLabel: anchor.getAttribute("aria-label")
        }))
        .filter((link) => link.text || link.ariaLabel);

      const fixedOrSticky = [...document.querySelectorAll("*")]
        .map((el) => {
          const styles = getComputedStyle(el);
          if (!["fixed", "sticky"].includes(styles.position)) {
            return null;
          }

          const rect = el.getBoundingClientRect();
          return {
            name: el.getAttribute("data-framer-name") || el.tagName.toLowerCase(),
            position: styles.position,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            zIndex: styles.zIndex
          };
        })
        .filter(Boolean)
        .slice(0, 40);

      const animatedElements = [...document.querySelectorAll("*")]
        .map((el) => {
          const styles = getComputedStyle(el);
          if (
            styles.transitionDuration === "0s" &&
            styles.animationName === "none"
          ) {
            return null;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 20) {
            return null;
          }

          return {
            name: el.getAttribute("data-framer-name") || el.tagName.toLowerCase(),
            transition: styles.transition,
            animation: styles.animation,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
        .filter(Boolean)
        .slice(0, 120);

      return {
        url: location.href,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || "",
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        body: {
          backgroundColor: bodyStyles.backgroundColor,
          color: bodyStyles.color,
          fontFamily: bodyStyles.fontFamily
        },
        meta: {
          favicon: [...document.querySelectorAll('link[rel*="icon"]')].map((link) => ({
            rel: link.rel,
            href: link.href
          })),
          ogImage: document.querySelector('meta[property="og:image"]')?.content || "",
          canonical: document.querySelector('link[rel="canonical"]')?.href || ""
        },
        fonts: [...document.fonts].map((font) => ({
          family: font.family,
          style: font.style,
          weight: font.weight,
          status: font.status
        })),
        cssTokens,
        sections: sectionCandidates,
        textNodes,
        images,
        backgrounds,
        links,
        fixedOrSticky,
        animatedElements
      };
    })()`
  );
}

async function getVisibleText(session) {
  return evaluate(
    session,
    "(document.body.innerText || '').replace(/\\n{3,}/g, '\\n\\n').trim()"
  );
}

async function captureScreenshot(session, filePath) {
  const metrics = await session.send("Page.getLayoutMetrics");
  const width = Math.ceil(metrics.contentSize.width);
  const height = Math.ceil(metrics.contentSize.height);

  const result = await session.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width,
      height,
      scale: 1,
    },
  });

  const buffer = Buffer.from(result.data, "base64");
  await writeFile(filePath, buffer);
}

async function runViewportCapture(session, viewport, screenshotPath) {
  await configurePage(session, viewport);
  await navigate(session, url);
  await autoscroll(session);
  await captureScreenshot(session, screenshotPath);
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browserPath = await findBrowser();
  const port = 9222 + Math.floor(Math.random() * 500);
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "codex-browser-"));

  const browser = spawn(
    browserPath,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${normalizeFileUrl(userDataDir)}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-extensions",
      "--disable-background-networking",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    const targets = await waitForDebugger(port);
    const pageTarget = targets.find((target) => target.type === "page");

    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error("Could not find a debuggable page target.");
    }

    const session = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await session.connect();

    try {
      await runViewportCapture(
        session,
        desktopViewport,
        path.join(outputDir, "desktop-full.png")
      );

      const renderedHtml = await getDocumentHtml(session);
      const summary = await getPageSummary(session);
      const visibleText = await getVisibleText(session);

      await writeFile(path.join(outputDir, "rendered.html"), renderedHtml);
      await writeFile(
        path.join(outputDir, "page-data.json"),
        JSON.stringify(summary, null, 2)
      );
      await writeFile(path.join(outputDir, "visible-text.txt"), visibleText);

      await runViewportCapture(
        session,
        mobileViewport,
        path.join(outputDir, "mobile-full.png")
      );
    } finally {
      await session.close();
    }
  } finally {
    browser.kill("SIGTERM");
    await delay(300);
    try {
      await rm(userDataDir, { recursive: true, force: true });
    } catch {
      // Windows can briefly hold Crashpad files open after shutdown.
    }
  }
}

await main();
