const templateDomains = new Set([
  "palmer-template.framer.website",
  "www.palmer-template.framer.website",
  "framer.website",
  "www.framer.website",
  "framer.com",
  "www.framer.com",
  "framer.app",
  "www.framer.app",
]);

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function isTemplateHref(href) {
  if (!href || href.startsWith("#")) {
    return false;
  }

  try {
    const url = new URL(href, "https://palmer-template.framer.website");

    return templateDomains.has(url.hostname);
  } catch {
    return false;
  }
}

function rewriteHref(href) {
  const url = new URL(href, "https://palmer-template.framer.website");

  if (url.hash) {
    return url.hash;
  }

  if (url.pathname && url.pathname !== "/" && url.pathname !== "/index.html") {
    return url.pathname;
  }

  return "/";
}

function removeEmptyAncestors($, element) {
  let current = element;

  while (current && current.length) {
    const hasVisibleText = current.text().trim().length > 0;
    const hasChildren = current.children().length > 0;

    if (hasVisibleText || hasChildren) {
      break;
    }

    const parent = current.parent();
    current.remove();
    current = parent;
  }
}

async function sanitizeHtml() {
  const [{ readFile, writeFile }, path, cheerio] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
    import("cheerio"),
  ]);
  const htmlPath = path.join(process.cwd(), "src/content/palmer-home.html");
  const rawHtml = await readFile(htmlPath, "utf8");
  const $ = cheerio.load(rawHtml, { decodeEntities: false }, false);

  let removedBadgeCount = 0;
  let rewrittenLinkCount = 0;
  let normalizedTopLinkCount = 0;

  $('a[href*="framer.com"][href*="utm_campaign=free-plan-badge"]').each(
    (_, element) => {
      const anchor = $(element);
      const wrapper = anchor.parent();

      if (wrapper.length && wrapper.children().length === 1) {
        const parent = wrapper.parent();
        wrapper.remove();
        removeEmptyAncestors($, parent);
      } else {
        const parent = anchor.parent();
        anchor.remove();
        removeEmptyAncestors($, parent);
      }

      removedBadgeCount += 1;
    }
  );

  const rootDiv = $("div").first();

  if (rootDiv.length) {
    rootDiv.attr("id", "top");
  }

  $("a").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");

    if (!href) {
      return;
    }

    if (isTemplateHref(href)) {
      anchor.attr("href", rewriteHref(href));
      rewrittenLinkCount += 1;
    }

    const nextHref = anchor.attr("href") ?? href;
    const anchorText = normalizeWhitespace(anchor.text());
    const ariaLabel = normalizeWhitespace(anchor.attr("aria-label") ?? "");
    const title = normalizeWhitespace(anchor.attr("title") ?? "");

    if (
      nextHref === "#top" ||
      anchorText.includes("back to top") ||
      ariaLabel.includes("back to top") ||
      title.includes("back to top")
    ) {
      anchor.attr("href", "#top");
      normalizedTopLinkCount += 1;
    }

    const finalHref = anchor.attr("href") ?? "";

    if (finalHref.startsWith("#") || finalHref.startsWith("/")) {
      anchor.removeAttr("target");
      anchor.removeAttr("rel");
    }
  });

  const sanitizedHtml = `${$.root().html()}\n`;
  await writeFile(htmlPath, sanitizedHtml, "utf8");

  console.log(
    [
      `sanitized ${path.relative(process.cwd(), htmlPath)}`,
      `removed badges: ${removedBadgeCount}`,
      `rewritten links: ${rewrittenLinkCount}`,
      `normalized top links: ${normalizedTopLinkCount}`,
    ].join(" | ")
  );
}

sanitizeHtml().catch((error) => {
  console.error("Failed to sanitize Palmer HTML.");
  console.error(error);
  process.exitCode = 1;
});
