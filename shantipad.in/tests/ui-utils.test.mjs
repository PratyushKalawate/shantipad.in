import assert from "node:assert/strict";
import test from "node:test";

import {
  appointmentContacts,
  escapeHtml,
  formatPhone,
  groupedHours,
  LANGUAGES,
  localizedText,
  matchesSearch,
  normalizeSearch,
  resolveCopy,
  safeUrl,
  validPhone,
  validateContent,
} from "../static/ui-utils.mjs";

const ORIGIN = "http://127.0.0.1:8000";

test("HTML escaping covers markup, attributes and null values", () => {
  assert.equal(escapeHtml(`<img src="x" onerror='alert(1)'>&`), "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;");
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(2006), "2006");
  assert.equal(escapeHtml("दंत चिकित्सा / दंतचिकित्सा"), "दंत चिकित्सा / दंतचिकित्सा");
});

test("localized text selects Hindi and Marathi with English fallback", () => {
  assert.deepEqual(LANGUAGES, ["en", "hi", "mr"]);
  const value = { en: "Dental care", hi: "दंत चिकित्सा", mr: "दंतचिकित्सा" };
  assert.equal(localizedText(value, "hi"), "दंत चिकित्सा");
  assert.equal(localizedText(value, "mr"), "दंतचिकित्सा");
  assert.equal(localizedText({ en: "Dental care", hi: "", mr: null }, "hi"), "Dental care");
  assert.equal(localizedText({ en: "Dental care" }, "mr"), "Dental care");
  assert.equal(localizedText(value, "unknown"), "Dental care");
  assert.equal(localizedText({}, "en"), "");
  assert.equal(localizedText("Shared text", "mr"), "Shared text");
  assert.equal(localizedText(null, "en"), "");
});

test("page copy preserves translated labels and administrator English fallbacks", () => {
  const copy = {
    en: { call: "Call our reception", careTitle: "Our care team" },
    hi: { call: "हमसे बात करें" },
    mr: { careTitle: "आमचे डॉक्टर" },
  };
  assert.equal(resolveCopy(copy, "hi", "call"), "हमसे बात करें");
  assert.equal(resolveCopy(copy, "mr", "call"), "Call our reception");
  assert.equal(resolveCopy(copy, "mr", "careTitle"), "आमचे डॉक्टर");
  assert.equal(resolveCopy(copy, "hi", "careTitle"), "Our care team");
  assert.equal(resolveCopy(copy, "unknown", "call"), "Call our reception");
});

test("missing or unpublished essential page keys retain localized control labels", () => {
  const essential = ["call", "menu", "close", "language", "searchServices", "noServiceResults", "appointmentLine", "hospitalLine", "visitDetails", "bookingUnavailable"];
  for (const language of LANGUAGES) {
    for (const key of essential) {
      assert.ok(resolveCopy({ en: {}, hi: {}, mr: {} }, language, key).trim(), `${language}.${key} must remain usable`);
    }
  }
  assert.equal(resolveCopy({}, "hi", "close"), "बंद करें");
  assert.equal(resolveCopy(undefined, "mr", "language"), "भाषा निवडा");
  assert.equal(resolveCopy(null, "unknown", "call"), "Call to book");
  assert.equal(resolveCopy({}, "en", "bookingUnavailable"), "Please contact the hospital to arrange your visit.");
  assert.equal(resolveCopy({}, "en", "careTitle"), "");
  assert.equal(resolveCopy({}, "en", "constructor"), "");
});

test("empty or malformed copy cannot blank essential controls", () => {
  assert.equal(resolveCopy({ en: { call: "" }, hi: { call: "  \n " } }, "hi", "call"), "बुकिंग के लिए कॉल करें");
  assert.equal(resolveCopy({ en: { call: "Call reception" }, mr: { call: "\t" } }, "mr", "call"), "Call reception");
  assert.equal(resolveCopy({ en: { menu: null }, mr: { menu: {} } }, "mr", "menu"), "मेन्यू उघडा");
  assert.equal(resolveCopy({ en: Object.create({ close: "Inherited text" }) }, "en", "close"), "Close");
});

test("safe URLs allow local assets, same-origin HTTP and external HTTPS", () => {
  assert.equal(safeUrl("/static/assets/family-care.jpg", ORIGIN), `${ORIGIN}/static/assets/family-care.jpg`);
  assert.equal(safeUrl(`${ORIGIN}/media/doctors/photo.jpg`, ORIGIN), `${ORIGIN}/media/doctors/photo.jpg`);
  assert.equal(safeUrl("https://example.test/photo.jpg?width=500", ORIGIN), "https://example.test/photo.jpg?width=500");
  assert.equal(safeUrl("//example.test/photo.jpg", "https://hospital.example"), "https://example.test/photo.jpg");
});

test("safe URLs reject executable protocols, remote HTTP and invalid inputs", () => {
  for (const value of [
    "javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)>", "file:///etc/passwd", "blob:https://example.test/id",
    "http://example.test/photo.jpg", "http://127.0.0.1:8001/photo.jpg", "//example.test/photo.jpg",
    "https://[", "", "   ", null, undefined, {}, 42,
  ]) {
    assert.equal(safeUrl(value, ORIGIN), "", `Unexpected accepted URL: ${String(value)}`);
  }
});

test("URLs with embedded credentials are rejected even over HTTPS", () => {
  for (const value of [
    "https://user@example.test/photo.jpg", "https://user:password@example.test/photo.jpg",
    "https://:password@example.test/photo.jpg", "https://user%40name@example.test/photo.jpg",
    "http://user@127.0.0.1:8000/photo.jpg",
  ]) {
    assert.equal(safeUrl(value, ORIGIN), "");
  }
});

test("telephone validation requires a plus-prefixed international number", () => {
  for (const value of ["+919326543972", "+12345678", "+123456789012345"]) assert.equal(validPhone(value), true);
  for (const value of ["9326543972", "+91 93265 43972", "+01234567", "+1234567", "+1234567890123456", "+91abc543972", "tel:+919326543972", null, 919326543972]) {
    assert.equal(validPhone(value), false, `Unexpected accepted telephone: ${String(value)}`);
  }
});

test("Indian phone numbers are displayed clearly without rewriting other numbers", () => {
  assert.equal(formatPhone("+919326543972"), "+91 93265 43972");
  assert.equal(formatPhone("+442079460123"), "+442079460123");
});

test("valid booking contacts take priority over the hospital line", () => {
  const appointments = ["+919326543972", null, "not a phone", "+919699853928"];
  const original = [...appointments];
  assert.deepEqual(appointmentContacts(appointments, "+919405644319"), [
    { number: "+919326543972", isHospital: false },
    { number: "+919699853928", isHospital: false },
  ]);
  assert.deepEqual(appointments, original);
});

test("missing or malformed booking phones fall back to the validated hospital phone", () => {
  for (const appointments of [[], undefined, null, "not an array", ["9326543972", "tel:+919326543972", "+91 93265 43972", {}]]) {
    assert.deepEqual(appointmentContacts(appointments, "+919405644319"), [{ number: "+919405644319", isHospital: true }]);
  }
});

test("no contact is produced when neither booking nor hospital phone is valid", () => {
  for (const hospitalPhone of [undefined, null, "", "94056 44319", "javascript:alert(1)"]) {
    assert.deepEqual(appointmentContacts(["invalid"], hospitalPhone), []);
  }
  assert.deepEqual(appointmentContacts(["+919326543972"], "invalid"), [{ number: "+919326543972", isHospital: false }]);
});

test("search normalizes case, Unicode compatibility characters and spacing", () => {
  assert.equal(normalizeSearch("  DENTAL\n\tCare  "), "dental care");
  assert.equal(normalizeSearch("ＤＥＮＴＡＬ"), "dental");
  assert.equal(normalizeSearch(null), "");
  assert.equal(matchesSearch("Child and newborn care", " NEWBORN  child "), true);
  assert.equal(matchesSearch("Child and newborn care", "child dental"), false);
  assert.equal(matchesSearch("Vaccination", "  "), true);
});

test("search matches Hindi and Marathi without removing meaningful characters", () => {
  assert.equal(normalizeSearch("  दंत\n चिकित्सा  "), "दंत चिकित्सा");
  assert.equal(matchesSearch("बच्चों और नवजात शिशुओं की देखभाल", "नवजात देखभाल"), true);
  assert.equal(matchesSearch("दंत व मुख चिकित्सा", "मुख चिकित्सा"), true);
  assert.equal(matchesSearch("बालकांची व नवजात शिशूंची काळजी", "नवजात काळजी"), true);
  assert.equal(matchesSearch("दंत व मुख चिकित्सा", "लसीकरण"), false);
});

function content() {
  return {
    hospital: { name: { en: "Shantipad" } }, copy: { en: {} },
    doctors: [], services: [], facilities: [], partners: [], appointments: [], hours: [], faqs: [],
  };
}

test("content validation returns a complete response without replacing it", () => {
  const data = content();
  assert.equal(validateContent(data), data);
});

test("content validation rejects missing hospital, copy and collection fields", () => {
  for (const data of [null, undefined, {}, { ...content(), hospital: null }, { ...content(), hospital: {} }, { ...content(), copy: {} }]) {
    assert.throws(() => validateContent(data), /Incomplete hospital content/);
  }
  for (const key of ["doctors", "services", "facilities", "partners", "appointments", "hours", "faqs"]) {
    for (const value of [undefined, null, "not an array", {}]) {
      assert.throws(() => validateContent({ ...content(), [key]: value }), /Incomplete hospital content/);
    }
  }
});

function hours() {
  return [
    { label: { en: "Monday to Saturday", hi: "सोमवार से शनिवार", mr: "सोमवार ते शनिवार" }, times: { en: "9:30 AM to 4 PM; 6 PM to 8 PM" }, note: { en: "Lunch: noon to 1 PM" } },
    { label: { en: "Sunday", hi: "रविवार", mr: "रविवार" }, times: { en: "9:30 AM to 4 PM; 6 PM to 8 PM" }, note: { en: "Lunch: noon to 1 PM" } },
  ];
}

test("matching weekday and Sunday hours are grouped without modifying source data", () => {
  const data = hours();
  const original = structuredClone(data);
  assert.deepEqual(groupedHours(data, "en"), [{
    labels: ["Monday to Saturday", "Sunday"], times: "9:30 AM to 4 PM; 6 PM to 8 PM", note: "Lunch: noon to 1 PM",
  }]);
  assert.deepEqual(data, original);
  assert.deepEqual(groupedHours([], "en"), []);
});

test("changed Sunday hours or lunch notes remain separate groups", () => {
  const changedTime = hours();
  changedTime[1].times.en = "10 AM to 1 PM";
  assert.equal(groupedHours(changedTime, "en").length, 2);
  assert.deepEqual(groupedHours(changedTime, "en")[1].labels, ["Sunday"]);
  const changedNote = hours();
  changedNote[1].note.en = "Call to confirm Sunday availability";
  assert.equal(groupedHours(changedNote, "en").length, 2);
});

test("hour labels translate while unavailable time translations fall back to English", () => {
  const hi = groupedHours(hours(), "hi");
  const mr = groupedHours(hours(), "mr");
  assert.deepEqual(hi[0].labels, ["सोमवार से शनिवार", "रविवार"]);
  assert.deepEqual(mr[0].labels, ["सोमवार ते शनिवार", "रविवार"]);
  assert.equal(hi[0].times, "9:30 AM to 4 PM; 6 PM to 8 PM");
  assert.equal(mr[0].note, "Lunch: noon to 1 PM");
});
