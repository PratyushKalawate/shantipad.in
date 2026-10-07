import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { build, PAGES, PROJECT_ROOT, publicAssetPaths, publicFiles } from "../scripts/build.mjs";

const content = JSON.parse(await readFile(path.join(PROJECT_ROOT, "content.json"), "utf8"));

test("current public content keeps confirmed doctor and appointment information", () => {
  assert.equal(content.doctors.find(doctor => doctor.specialty === "dental").experience.en, "20 years of experience");
  assert.match(content.hospital.address.en, /^Murarka College Road/);
  assert.equal(content.services.length, 20);
  assert.equal(content.appointments.length, 3);
  assert.deepEqual(content.hours[0].times, content.hours[1].times);
  for (const language of ["en", "hi", "mr"]) {
    assert.ok(content.hospital.name[language]);
    assert.ok(content.copy[language].call);
  }
  assert.doesNotMatch(JSON.stringify(content), /Bhairav|PESHCO|nabh-certificate/i);
});

test("private fields, documents, remote images and traversal fail the static build", () => {
  for (const asset of ["../private/file.png", "static/assets/../file.jpg", "/media/doctor.jpg", "https://example.test/image.jpg", "static/assets/certificate.pdf", "static/assets/nabh-mark.jpeg"]) {
    const copy = structuredClone(content);
    copy.hospital.logo_url = asset;
    assert.throws(() => publicAssetPaths(copy));
  }
  const copy = structuredClone(content);
  copy.hospital.certificate_url = "private-file.pdf";
  assert.throws(() => publicAssetPaths(copy), /Private/);
  delete copy.hospital.certificate_url;
  copy.copy.en.viewCertificate = "Private record";
  assert.throws(() => publicAssetPaths(copy), /Private/);
});

test("page entry points use working relative assets at any hosting prefix", async () => {
  for (const page of PAGES) {
    const html = await readFile(path.join(PROJECT_ROOT, page), "utf8");
    assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);
    const prefix = page === "index.html" ? "" : "../";
    assert.ok(html.includes(`src="${prefix}static/app.js"`));
    assert.ok(html.includes(`href="${prefix}static/styles.css"`));
  }
  const app = await readFile(path.join(PROJECT_ROOT, "static/app.js"), "utf8");
  assert.doesNotMatch(app, /\/api\/|localhost|127\.0\.0\.1|\/admin\//);
  assert.match(app, /new URL\("content\.json", root\)/);
});

test("build publishes only approved static files and removes stale generated output", async t => {
  const source = await mkdtemp(path.join(os.tmpdir(), "shantipad-build-"));
  t.after(() => rm(source, { recursive: true, force: true }));
  const expected = await publicFiles(PROJECT_ROOT);
  for (const file of expected) {
    await mkdir(path.dirname(path.join(source, file)), { recursive: true });
    await cp(path.join(PROJECT_ROOT, file), path.join(source, file));
  }
  await mkdir(path.join(source, "private"));
  await writeFile(path.join(source, "private/certificate.pdf"), "private");
  await writeFile(path.join(source, ".env"), "SECRET=not-public");
  await writeFile(path.join(source, "static/assets/unreferenced.png"), "not-public");
  await mkdir(path.join(source, "dist"));
  await writeFile(path.join(source, "dist/stale.txt"), "old output");
  const result = await build(source);
  const files = await readdir(result.destination, { recursive: true });
  assert.deepEqual(result.files, expected);
  for (const unwanted of ["private", ".env", "stale.txt", "static/assets/unreferenced.png", "scripts", "README.md"]) assert.ok(!files.includes(unwanted));
  assert.deepEqual(JSON.parse(await readFile(path.join(result.destination, "content.json"), "utf8")), content);
  await rm(path.join(source, "static/assets/hospital-logo.jpeg"));
  await symlink(path.join(source, "private/certificate.pdf"), path.join(source, "static/assets/hospital-logo.jpeg"));
  await assert.rejects(publicFiles(source), /Symlinks/);
});
