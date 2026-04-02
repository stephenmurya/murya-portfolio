import { readFile } from "node:fs/promises";
import path from "node:path";

export default async function Home() {
  const htmlPath = path.join(process.cwd(), "src/content/palmer-home.html");
  const palmerHome = await readFile(htmlPath, "utf8");

  return <main dangerouslySetInnerHTML={{ __html: palmerHome }} />;
}
