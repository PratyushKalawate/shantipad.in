import assert from "node:assert/strict";
import test from "node:test";
import { assetHref, pagePath, routeHref, siteRoot } from "../static/site-paths.mjs";

for (const base of ["https://shantipad.com/", "https://example.github.io/hospital/", "http://127.0.0.1:4174/preview/"]) {
  test(`routes and assets stay under ${base}`, () => {
    const root = siteRoot(`${base}static/app.js`);
    assert.equal(root.href, base);
    for (const route of ["/", "/about/", "/child-care/", "/dental-care/", "/doctors/", "/contact/"]) {
      const target = new URL(route.slice(1), base);
      assert.equal(routeHref(route, root), target.pathname);
      assert.equal(pagePath(target.pathname, root), route);
      assert.equal(pagePath(`${target.pathname}index.html`, root), route);
    }
    assert.equal(routeHref("#care", root), "#care");
    assert.equal(assetHref("static/assets/hospital-logo.jpeg", root), `${base}static/assets/hospital-logo.jpeg`);
    assert.equal(assetHref("/static/assets/hospital-logo.jpeg", root), `${base}static/assets/hospital-logo.jpeg`);
  });
}

test("outside paths do not masquerade as a department route", () => {
  assert.equal(pagePath("/doctors/", "https://example.github.io/hospital/"), "/");
  assert.equal(pagePath("/hospital-extra/doctors/", "https://example.github.io/hospital/"), "/");
});

test("empty and unsafe asset values never become image URLs", () => {
  const root = "https://example.github.io/hospital/";
  for (const value of ["", " ", undefined, null, {}, "javascript:alert(1)", "data:text/html,hello", "http://other.test/photo.jpg", "https://user:password@example.test/image.jpg"]) {
    assert.equal(assetHref(value, root), "");
  }
  assert.equal(assetHref("https://maps.google.com/?q=Shegaon", root), "https://maps.google.com/?q=Shegaon");
});
