import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { PAGES, PROJECT_ROOT, publicFiles } from "../scripts/build.mjs";
import { legalPages } from "../static/legal-content.mjs";

const read = file => readFile(path.join(PROJECT_ROOT, file), "utf8");
const content = JSON.parse(await read("content.json"));

test("eight direct page entries include privacy and terms", () => {
  assert.deepEqual(new Set(PAGES), new Set([
    "index.html", "about/index.html", "child-care/index.html",
    "dental-care/index.html", "doctors/index.html", "contact/index.html",
    "privacy/index.html", "terms/index.html",
  ]));
  assert.equal(PAGES.length, 8);
});

test("every page uses the supplied hospital logo as its local favicon", async () => {
  for (const page of PAGES) {
    const html = await read(page);
    const icons = [...html.matchAll(/<link\b[^>]*\brel="icon"[^>]*>/g)];
    assert.equal(icons.length, 1, `${page} must have exactly one favicon`);
    const prefix = page === "index.html" ? "" : "../";
    assert.ok(icons[0][0].includes(`href="${prefix}static/assets/hospital-logo.jpeg"`), page);
    assert.match(icons[0][0], /type="image\/jpeg"/);
    assert.doesNotMatch(html, /<(?:script|link|iframe)\b[^>]*(?:src|href)="https?:\/\//i, page);
  }
});

test("privacy and terms are linked from the shared footer and included in the build", async () => {
  const app = await read("static/app.js");
  const start = app.indexOf("function footer()");
  const end = app.indexOf("function render()", start);
  assert.ok(start >= 0 && end > start, "Shared footer and renderer must be present");
  const footer = app.slice(start, end);
  for (const route of ["/privacy/", "/terms/"]) {
    assert.ok(footer.includes(`href("${route}")`), `Footer must link to ${route}`);
  }
  const files = await publicFiles();
  for (const file of ["privacy/index.html", "terms/index.html", "static/legal-content.mjs"]) {
    assert.ok(files.includes(file), `${file} must be published`);
  }
});

test("both legal pages provide readable sections in all three languages", () => {
  for (const page of ["privacy", "terms"]) {
    for (const language of ["en", "hi", "mr"]) {
      const legal = legalPages[page]?.[language];
      assert.ok(legal?.title?.trim(), `${page}/${language} title`);
      assert.ok(legal.intro?.trim(), `${page}/${language} introduction`);
      assert.ok(legal.sections.length > 0, `${page}/${language} sections`);
      for (const section of legal.sections) {
        assert.ok(section.heading?.trim());
        assert.ok(section.paragraphs.length > 0);
        assert.ok(section.paragraphs.every(paragraph => typeof paragraph === "string" && paragraph.trim()));
      }
    }
  }
});

test("published content has no stock hero, unapproved photos, AI branding or trackers", async () => {
  assert.equal(content.hospital.hero_image_url, "");
  assert.ok(content.doctors.every(doctor => !doctor.photo_url), "Doctor photos require explicit hospital approval");
  const files = await publicFiles();
  assert.ok(!files.includes("static/assets/family-care.jpg"));
  const publicSource = (await Promise.all(files.filter(file => /\.(?:html|mjs|js|json)$/.test(file)).map(read))).join("\n");
  assert.doesNotMatch(publicSource, /(?:made|built|generated|powered)\s+(?:with|by)\s+(?:AI|OpenAI|ChatGPT|Codex)\b/i);
  assert.doesNotMatch(publicSource, /\bdata-ai(?:-|=)|<meta\b[^>]*name="generator"/i);
  assert.doesNotMatch(publicSource, /googletagmanager|google-analytics|connect\.facebook\.net|\bfbq\s*\(|\bgtag\s*\(|hotjar|clarity\.ms/i);
  assert.doesNotMatch(publicSource, /document\.cookie\s*=/);
});

test("public hospital and legal copy contains no em dashes or emoji", async () => {
  const sources = [await read("content.json"), await read("static/legal-content.mjs")];
  for (const source of sources) {
    assert.doesNotMatch(source, /\u2014/);
    assert.doesNotMatch(source, /[\u{1F300}-\u{1FAFF}]|\p{Extended_Pictographic}\uFE0F/u);
  }
});

test("styles do not introduce gradients, animated scroll effects or custom cursors", async () => {
  const css = await read("static/styles.css");
  const app = await read("static/app.js");
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
  assert.doesNotMatch(css, /scroll-behavior\s*:\s*smooth/i);
  assert.doesNotMatch(css, /@keyframes|animation(?:-name)?\s*:(?!\s*none)/i);
  assert.doesNotMatch(css, /cursor\s*:\s*(?:url\s*\(|none)/i);
  assert.doesNotMatch(app, /addEventListener\(\s*["'](?:scroll|mousemove|pointermove)["']/);
});

test("confirmed hospital details survive the design update", () => {
  assert.equal(content.hospital.phone, "+919405644319");
  assert.equal(content.hospital.address.en, "Murarka College Road, Shegaon, Buldhana 444203, Maharashtra");
  assert.equal(content.hospital.emergency_24h, true);
  assert.deepEqual(new Set(content.appointments), new Set([
    "+919326543972", "+919699853928", "+918459737894",
  ]));
  const childDoctor = content.doctors.find(doctor => doctor.specialty === "child");
  const dentalDoctor = content.doctors.find(doctor => doctor.specialty === "dental");
  assert.equal(childDoctor.name.en, "Dr. Akhilesh Kalawate");
  assert.equal(childDoctor.qualifications, "MBBS, DCH (Gold Medal)");
  assert.match(childDoctor.experience.en, /15 years/);
  assert.match(childDoctor.experience.en, /DNB registrar/);
  assert.equal(dentalDoctor.name.en, "Dr. Sonal Akhilesh Kalawate");
  assert.equal(dentalDoctor.qualifications, "BDS");
  assert.equal(dentalDoctor.experience.en, "20 years of experience");
  assert.equal(content.services.length, 20);
  assert.deepEqual(content.hours[0].times, content.hours[1].times);
  assert.deepEqual(content.hours[0].note, content.hours[1].note);
  for (const hours of content.hours) {
    assert.match(hours.times.en, /9:30 AM/);
    assert.match(hours.times.en, /4:00 PM/);
    assert.match(hours.times.en, /6:00 PM/);
    assert.match(hours.times.en, /8:00 PM/);
    assert.match(hours.note.en, /12:00 PM/);
    assert.match(hours.note.en, /1:00 PM/);
  }
  assert.doesNotMatch(JSON.stringify(content), /Bhairav|PESHCO|nabh-certificate/i);
});
