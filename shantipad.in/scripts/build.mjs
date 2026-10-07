import { copyFile, lstat, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateContent } from "../static/ui-utils.mjs";

export const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
export const PAGES = ["index.html", "about/index.html", "child-care/index.html", "dental-care/index.html", "doctors/index.html", "contact/index.html", "privacy/index.html", "terms/index.html"];
const FIXED_FILES = [...PAGES, ".nojekyll", "LICENSE-lucide", "content.json", "static/app.js", "static/legal-content.mjs", "static/styles.css", "static/ui-utils.mjs", "static/site-paths.mjs", "static/lucide.min.js"];
const PUBLIC_KEYS = new Set(["hospital", "doctors", "services", "facilities", "partners", "appointments", "hours", "faqs", "copy"]);
const PRIVATE_KEY = /^(?:certificate|certification|certTitle|certBody|certNumber|certValidity|viewCertificate|password|secret|token|users|sessions)/i;

function checkPublicKeys(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (PRIVATE_KEY.test(key)) throw new Error(`Private content key is not allowed: ${key}`);
    checkPublicKeys(nested);
  }
}

export function publicAssetPaths(content) {
  validateContent(content);
  if (Object.keys(content).some(key => !PUBLIC_KEYS.has(key))) throw new Error("Unexpected top-level content field.");
  checkPublicKeys(content);
  const images = [content.hospital.logo_url, content.hospital.hero_image_url, ...content.doctors.map(doctor => doctor.photo_url)];
  const assets = new Set();
  for (const value of images) {
    if (!value) continue;
    if (typeof value !== "string" || !/^static\/assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(value)) {
      throw new Error("Images must be local public JPEG, PNG or WebP files under static/assets/.");
    }
    if (/(?:certificate|certification|nabh)/i.test(value)) throw new Error("Private certification images cannot be published.");
    assets.add(value);
  }
  return [...assets];
}

export async function publicFiles(source = PROJECT_ROOT) {
  const content = JSON.parse(await readFile(path.join(source, "content.json"), "utf8"));
  const files = [...new Set([...FIXED_FILES, ...publicAssetPaths(content)])];
  // Reject linked files and linked directories before copying any public output.
  for (const file of files) {
    let current = source;
    for (const part of file.split("/")) {
      current = path.join(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlinks cannot be published: ${file}`);
    }
    if (!(await lstat(current)).isFile()) throw new Error(`Missing public file: ${file}`);
  }
  return files;
}

export async function build(source = PROJECT_ROOT) {
  const files = await publicFiles(source);
  const destination = path.join(source, "dist");
  await rm(destination, { recursive: true, force: true });
  for (const file of files) {
    const target = path.join(destination, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(source, file), target);
  }
  return { destination, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await build();
    console.log(`Built ${result.files.length} public files in ${result.destination}`);
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
