import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceFiles = [
  path.join(process.cwd(), "src/app/palmer.css"),
  path.join(process.cwd(), "src/content/palmer-home.html"),
  path.join(
    process.cwd(),
    "docs/design-references/palmer-template.framer.website/rendered.html"
  ),
];

const destinationRoot = path.join(process.cwd(), "public");
const manifestPath = path.join(
  process.cwd(),
  "docs/research/palmer-template.framer.website/asset-manifest.json"
);

function decodeHtmlEntities(value) {
  return value.replace(/&amp;/g, "&");
}

function getAssetDirectory(url) {
  const pathname = url.pathname.toLowerCase();

  if (pathname.includes("/images/")) {
    if (pathname.includes("/seo/")) {
      return "seo/palmer";
    }

    return "images/palmer";
  }

  if (pathname.includes("/assets/")) {
    return "fonts/palmer";
  }

  if (pathname.includes("/videos/")) {
    return "videos/palmer";
  }

  return "assets/palmer";
}

function getLocalPath(rawUrl) {
  const url = new URL(rawUrl);
  const directory = getAssetDirectory(url);
  const parsed = path.parse(url.pathname);
  const queryHash = url.search
    ? `-${createHash("sha1").update(url.search).digest("hex").slice(0, 10)}`
    : "";
  const safeBase = parsed.name.replace(/[^a-z0-9-_]+/gi, "-");
  const filename = `${safeBase}${queryHash}${parsed.ext || ".bin"}`;

  return {
    relative: `/${directory}/${filename}`,
    absolute: path.join(destinationRoot, directory, filename),
  };
}

async function collectUrls() {
  const urlSet = new Set();

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, "utf8");
    const matches = content.match(/https:\/\/framerusercontent\.com\/[^"'()\s<>]+/g);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      urlSet.add(decodeHtmlEntities(match));
    }
  }

  return [...urlSet].sort();
}

async function download(url) {
  const destination = getLocalPath(url);
  await mkdir(path.dirname(destination.absolute), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination.absolute, buffer);

  return destination.relative;
}

async function runWithConcurrency(items, worker, concurrency = 4) {
  const results = new Map();
  let index = 0;

  async function next() {
    if (index >= items.length) {
      return;
    }

    const current = items[index];
    index += 1;

    const result = await worker(current);
    results.set(current, result);
    await next();
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => next())
  );

  return results;
}

async function main() {
  const urls = await collectUrls();
  const manifest = await runWithConcurrency(urls, download, 4);
  const manifestObject = Object.fromEntries(manifest.entries());

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifestObject, null, 2));

  console.log(
    `Downloaded ${urls.length} Palmer assets to ${path.relative(process.cwd(), destinationRoot)}`
  );
}

await main();
