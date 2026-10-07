import {
  LANGUAGES, escapeHtml, localizedText, validPhone, formatPhone,
  matchesSearch, validateContent, groupedHours, resolveCopy, appointmentContacts,
} from "./ui-utils.mjs";
import { siteRoot, pagePath, routeHref, assetHref } from "./site-paths.mjs";
import { legalPages } from "./legal-content.mjs";

const routes = ["/", "/about/", "/child-care/", "/dental-care/", "/doctors/", "/contact/", "/privacy/", "/terms/"];
const navigation = {
  en: ["Home", "About us", "Child care", "Dental care", "Our doctors", "Contact"],
  hi: ["होम", "हमारे बारे में", "बाल चिकित्सा", "दंत चिकित्सा", "हमारे डॉक्टर", "संपर्क"],
  mr: ["मुख्यपृष्ठ", "आमच्याबद्दल", "बालरोग विभाग", "दंत विभाग", "आमचे डॉक्टर", "संपर्क"],
};
const statusText = {
  en: { loading: "Loading hospital information", error: "Hospital information is unavailable", retry: "Try again", skip: "Skip to content" },
  hi: { loading: "अस्पताल की जानकारी लोड हो रही है", error: "अस्पताल की जानकारी उपलब्ध नहीं है", retry: "फिर से कोशिश करें", skip: "मुख्य सामग्री पर जाएँ" },
  mr: { loading: "रुग्णालयाची माहिती लोड होत आहे", error: "रुग्णालयाची माहिती उपलब्ध नाही", retry: "पुन्हा प्रयत्न करा", skip: "मुख्य मजकुरावर जा" },
};
const notices = {
  en: { privacy: "Privacy policy", terms: "Terms and conditions", draft: "Draft for hospital review. Details marked [ADD REAL DATA] must be confirmed before publication.", emergency: "Emergency? Call the hospital now. Do not wait for an appointment.", emergencyCall: "Emergency call", photo: "Hospital photograph", booking: "Calling opens your phone app. No patient details are collected on this website." },
  hi: { privacy: "गोपनीयता नीति", terms: "नियम और शर्तें", draft: "अस्पताल की समीक्षा के लिए मसौदा। प्रकाशन से पहले [ADD REAL DATA] वाली जानकारी की पुष्टि आवश्यक है।", emergency: "आपात स्थिति है? तुरंत अस्पताल को कॉल करें। अपॉइंटमेंट का इंतजार न करें।", emergencyCall: "आपातकालीन कॉल", photo: "अस्पताल का फोटो", booking: "कॉल करने पर आपका फोन ऐप खुलता है। यह वेबसाइट मरीज की जानकारी नहीं लेती है।" },
  mr: { privacy: "गोपनीयता धोरण", terms: "नियम व अटी", draft: "रुग्णालयाच्या तपासणीसाठी मसुदा. प्रसिद्ध करण्यापूर्वी [ADD REAL DATA] असलेली माहिती निश्चित करणे आवश्यक आहे.", emergency: "आपत्कालीन परिस्थिती आहे? रुग्णालयाला त्वरित कॉल करा. भेटीची वाट पाहू नका.", emergencyCall: "आपत्कालीन कॉल", photo: "रुग्णालयाचे छायाचित्र", booking: "कॉल केल्यावर तुमचे फोन ॲप उघडते. ही वेबसाइट रुग्णांची माहिती घेत नाही." },
};
const app = document.getElementById("app");
const root = siteRoot(import.meta.url);
const path = pagePath(location.pathname, root);
const page = Math.max(0, routes.indexOf(path));
let language = "en";
let data;
try { language = localStorage.getItem("shantipad-language") || "en"; } catch { /* Storage is optional. */ }
if (!LANGUAGES.includes(language)) language = "en";

const text = value => localizedText(value, language);
const html = value => escapeHtml(text(value)).replace(/\n/g, "<br>");
const copy = key => resolveCopy(data?.copy, language, key);
const t = key => html(copy(key));
const url = value => assetHref(value, root);
const href = route => escapeHtml(routeHref(route, root));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const link = (target, label, className = "text-link") => `<a class="${className}" href="${target.startsWith("/") || target.startsWith("#") ? href(target) : escapeHtml(target)}">${label}${icon("arrow-up-right")}</a>`;
const call = (className = "button-primary") => `<button class="button ${className}" data-call>${icon("phone")}<span>${t("call")}</span></button>`;
const pageTitle = () => navigation[language][page] || notices[language][page === 6 ? "privacy" : "terms"];

function emergencyNotice() {
  return data.hospital.emergency_24h && validPhone(data.hospital.phone)
    ? `<aside class="booking-safety"><p>${escapeHtml(notices[language].emergency)}</p>${phoneLink(data.hospital.phone)}</aside>` : "";
}

function phoneLink(number) {
  return validPhone(number) ? `<a class="phone-link" href="tel:${number}">${icon("phone")}<bdi>${escapeHtml(formatPhone(number))}</bdi></a>` : "";
}

function appointmentLinks() {
  const contacts = appointmentContacts(data.appointments, data.hospital.phone);
  if (!contacts.length) return `<p role="status">${t("bookingUnavailable")}</p>`;
  return `<div class="appointment-options">${contacts.map(({ number, isHospital }, index) => `
    <a class="appointment-line" href="tel:${number}">
      <span class="appointment-symbol">${icon("phone")}</span>
      <span><small>${isHospital ? t("hospitalLine") : `${t("appointmentLine")} ${index + 1}`}</small><bdi>${escapeHtml(formatPhone(number))}</bdi></span>
      ${icon("arrow-up-right")}
    </a>`).join("")}</div>`;
}

function brand() {
  const source = url(data.hospital.logo_url);
  return `<a href="${href("/")}" class="brand" aria-label="${escapeHtml(text(data.hospital.name))}">
    ${source ? `<img class="brand-logo" src="${escapeHtml(source)}" alt="" width="56" height="56">` : `<span class="brand-icon">${icon("cross")}</span>`}
    <span><strong>${html(data.hospital.name)}</strong><small>${t("descriptor")}</small></span>
  </a>`;
}

function photo(priority = false) {
  const source = url(data.hospital.hero_image_url);
  return source ? `<figure class="family-photo">
    <img src="${escapeHtml(source)}" alt="${escapeHtml(copy("heroImageAlt"))}" width="1800" height="1200" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    ${copy("heroImageCaption") ? `<figcaption>${t("heroImageCaption")}</figcaption>` : ""}
  </figure>` : `<figure class="photo-placeholder"><span>${icon("image")}</span><figcaption><strong lang="en">[REAL PHOTO NEEDED]</strong><span>${escapeHtml(notices[language].photo)}</span></figcaption></figure>`;
}

function hours(compact = false) {
  const entries = compact ? groupedHours(data.hours, language) : data.hours.map(entry => ({
    labels: [text(entry.label)], times: text(entry.times), note: text(entry.note),
  }));
  return `<dl class="hours-list ${compact ? "compact-hours" : ""}">${entries.map(entry => `
    <div><dt>${entry.labels.map(escapeHtml).join(" · ")}</dt>
      <dd>${html(entry.times)}${entry.note ? `<small>${html(entry.note)}</small>` : ""}</dd>
    </div>`).join("")}</dl>${compact ? "" : `<p class="hours-note">${t("hoursNote")}</p>`}`;
}

function visitOverview() {
  return `<section class="visit-overview" aria-label="${escapeHtml(copy("visitDetails"))}"><div class="container overview-grid">
    <div class="overview-item"><span class="overview-icon">${icon("clock-3")}</span>
      <div><h2>${t("opd")}</h2>${hours(true)}</div></div>
    <div class="overview-item"><span class="overview-icon emergency-icon">${icon(data.hospital.emergency_24h ? "heart-pulse" : "phone")}</span>
      <div><h2>${t(data.hospital.emergency_24h ? "emergencyShort" : "hospitalLine")}</h2>${phoneLink(data.hospital.phone)}<p>${t("hoursNote")}</p></div></div>
    <div class="overview-item"><span class="overview-icon">${icon("map-pin")}</span>
      <div><h2>${t("addressLabel")}</h2><p>${html(data.hospital.address)}</p>${link("/contact/", t("visitDetails"))}</div></div>
  </div></section>`;
}

function care() {
  return `<section class="section care-section" id="care"><div class="container">
    <div class="section-heading"><div><p class="eyebrow">${t("careLabel")}</p><h2>${t("careTitle")}</h2></div><p>${t("careIntro")}</p></div>
    <div class="care-grid">${["child", "dental"].map((key, index) => {
      const services = data.services.filter(service => service.department === key);
      return `<a class="care-card ${key}" href="${href(routes[index + 2])}">
        <div class="care-card-top"><span class="care-icon">${icon(index ? "smile" : "baby")}</span><span class="number">0${index + 1}</span></div>
        <p class="eyebrow">${t(`${key}Tag`)}</p><h3>${t(key)}</h3><p>${t(`${key}Desc`)}</p>
        <ul class="care-preview">${services.slice(0, 3).map(service => `<li>${icon("check")}${html(service.name)}</li>`).join("")}</ul>
        <span class="card-link">${t(`${key}Link`)}${icon("arrow-up-right")}</span>
      </a>`;
    }).join("")}</div>
  </div></section>`;
}

function doctorCards(specialty) {
  const doctors = specialty ? data.doctors.filter(doctor => doctor.specialty === specialty) : data.doctors;
  return `<div class="doctor-grid ${specialty ? "single-doctor" : ""}">${doctors.map(doctor => {
    const source = url(doctor.photo_url);
    const department = doctor.specialty === "dental" ? "dental" : "child";
    return `<article class="doctor-card ${department}">
      <div class="doctor-identity">
        ${source ? `<img class="doctor-photo" src="${escapeHtml(source)}" alt="${escapeHtml(text(doctor.name))}" width="96" height="112" loading="lazy">` : `<span class="doctor-symbol" aria-hidden="true">${icon(department === "dental" ? "smile" : "stethoscope")}</span>`}
        <div><p class="eyebrow">${t(department)}</p><h3>${html(doctor.name)}</h3><p class="qualification">${html(doctor.qualifications)}</p></div>
      </div>
      <div class="doctor-copy">
        ${text(doctor.experience) ? `<p class="doctor-experience">${icon("briefcase-medical")}<span>${html(doctor.experience)}</span></p>` : ""}
        ${text(doctor.bio) ? `<p>${html(doctor.bio)}</p>` : ""}
        ${doctor.registration ? `<p>${t("registrationLabel")}: ${html(doctor.registration)}</p>` : ""}
        ${text(doctor.consultation) ? `<p class="consultation">${html(doctor.consultation)}</p>` : ""}
      </div>
      <div class="doctor-actions">${call("button-outline")}${link(routes[department === "dental" ? 3 : 2], t(`${department}Link`))}</div>
    </article>`;
  }).join("")}</div>`;
}

function doctors(specialty) {
  if (!data.doctors.some(doctor => !specialty || doctor.specialty === specialty)) return "";
  return `<section class="section doctors-section"><div class="container">
    <div class="section-heading"><div><p class="eyebrow">${t("doctorsLabel")}</p><h2>${t("doctorsTitle")}</h2></div>${link("/doctors/", t("meet"))}</div>
    ${doctorCards(specialty)}
  </div></section>`;
}

function local() {
  const source = url(data.hospital.logo_url);
  return `<section class="section local-section" id="rooted"><div class="container local-grid">
    <figure class="local-identity">${source ? `<img class="local-logo" src="${escapeHtml(source)}" alt="${escapeHtml(text(data.hospital.name))}" width="240" height="240" loading="lazy">` : `<h3>${html(data.hospital.name)}</h3>`}
      <figcaption>${icon("map-pin")}<span>${html(data.hospital.address)}</span></figcaption>
    </figure>
    <div><p class="eyebrow">${t("localLabel")}</p><h2>${t("localTitle")}</h2><p class="body-large">${html(data.hospital.about)}</p>${link("/about/", t("aboutLink"))}</div>
  </div></section>`;
}

function facilities() {
  if (!data.facilities.length) return "";
  return `<section class="section facilities-section"><div class="container"><p class="eyebrow">${t("aboutSmall")}</p><h2>${t("facilitiesHeading")}</h2>
    <div class="facility-grid">${data.facilities.map(facility => `<article>${icon("check")}<div><h3>${html(facility.name)}</h3>${text(facility.description) ? `<p>${html(facility.description)}</p>` : ""}</div></article>`).join("")}</div>
  </div></section>`;
}

function support() {
  return `<section class="section support-section" id="visit"><div class="container"><p class="eyebrow">${t("patientInformation")}</p><div class="support-grid">
    <div><h2>${t("opd")}</h2>${hours()}${data.hospital.emergency_24h ? `<p class="emergency-note">${icon("heart-pulse")}${t("emergency")}</p>` : ""}${phoneLink(data.hospital.phone)}</div>
    ${data.partners.length ? `<div class="cashless"><h2>${t("cashlessTitle")}</h2><p>${t("cashlessIntro")}</p><ul>${data.partners.map(partner => `<li>${html(partner)}</li>`).join("")}</ul></div>` : ""}
  </div></div></section>`;
}

function faq() {
  if (!data.faqs.length) return "";
  return `<section class="section faq-section"><div class="container faq-grid"><div><p class="eyebrow">${t("patientInformation")}</p><h2>${t("faqTitle")}</h2><p>${t("togetherBody")}</p>${link("/contact/", t("visitDetails"))}</div>
    <div class="faqs">${data.faqs.map(entry => `<details><summary>${html(entry.question)}${icon("plus")}</summary><p>${html(entry.answer)}</p></details>`).join("")}</div>
  </div></section>`;
}

function visit() {
  return `<section class="visit-band"><div class="container visit-content"><div><p class="eyebrow">${t("visitLabel")}</p><h2>${t("visitTitle")}</h2><p>${t("visitBody")}</p></div><div class="visit-actions">${call("button-white")}${link("/contact/", t("visitDetails"))}</div></div></section>`;
}

function innerHeading(eyebrow, title, intro, department = "") {
  return `<section class="inner-hero ${department}"><div class="container">
    <nav class="breadcrumb" aria-label="${escapeHtml(pageTitle())}"><a href="${href("/")}">${escapeHtml(navigation[language][0])}</a>${icon("chevron-right")}<span aria-current="page">${escapeHtml(pageTitle())}</span></nav>
    <p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="body-large">${intro}</p>
  </div></section>`;
}

function home() {
  return `<section class="hero"><div class="container hero-content">
    <p class="eyebrow">${t("eyebrow")}</p><h1>${t("hero")}</h1><p class="hero-intro">${t("careSummary")}</p>
    <div class="hero-actions">${call()}${link("#care", t("explore"), "button button-outline")}</div></div>${photo(true)}</section>
    ${visitOverview()}${care()}${doctors()}${facilities()}${support()}${local()}${faq()}${visit()}`;
}

function about() {
  return `${innerHeading(t("aboutSmall"), t("aboutTitle"), t("aboutIntro"))}
    <section class="section"><div class="container about-grid">${photo()}<div><p class="eyebrow">${t("localLabel")}</p><h2>${t("localTitle")}</h2><p class="body-large">${html(data.hospital.about)}</p>${link("/doctors/", t("meet"))}</div></div></section>
    ${facilities()}${doctors()}${support()}${visit()}`;
}

function department(key) {
  const services = data.services.filter(service => service.department === key);
  return `${innerHeading(t(key), t(key === "dental" ? "deptDentalTitle" : "deptChildTitle"), t(key === "dental" ? "deptDentalBody" : "deptChildBody"), key)}
    <section class="section"><div class="container department-grid"><div>
      <div class="services-title"><h2>${t("serviceHeading")}</h2><span class="service-count" aria-live="polite">${services.length} / ${services.length}</span></div>
      <label class="service-search">${icon("search")}<input id="service-search" type="search" placeholder="${escapeHtml(copy("searchServices"))}" aria-label="${escapeHtml(copy("searchServices"))}" aria-controls="service-list" autocomplete="off"></label>
      <ul class="service-list" id="service-list">${services.map((service, index) => `
        <li data-service data-search="${escapeHtml(`${text(service.name)} ${service.name.en || ""} ${text(service.description)}`)}"><span class="service-number">${String(index + 1).padStart(2, "0")}</span><div><h3>${html(service.name)}</h3>${text(service.description) ? `<p>${html(service.description)}</p>` : ""}</div></li>`).join("")}</ul>
      <p class="service-empty" ${services.length ? "hidden" : ""}>${t(services.length ? "noServiceResults" : "emptyServices")}</p>
    </div><aside class="prepare"><span class="overview-icon">${icon("calendar-days")}</span><p class="eyebrow">${t("visitDetails")}</p><h2>${t("opd")}</h2>${hours()}${call()}${link("/contact/", t("addressLabel"))}</aside></div></section>
    ${doctors(key)}${faq()}${visit()}`;
}

function contact() {
  const maps = url(data.hospital.maps_url);
  return `${innerHeading(t("visitLabel"), t("contactTitle"), t("contactIntro"))}
    <section class="section"><div class="container contact-grid">
      <div><p class="eyebrow">${t("phoneLabel")}</p><h2>${t("bookingTitle")}</h2><p class="contact-intro">${t("bookingIntro")}</p>${appointmentLinks()}${bookingNotice()}${emergencyNotice()}</div>
      <div class="contact-details"><div class="contact-row">${icon("map-pin")}<div><h3>${t("addressLabel")}</h3><p>${html(data.hospital.address)}</p>${maps ? link(maps, t("mapLabel")) : ""}</div></div>
        <div class="contact-row">${icon("heart-pulse")}<div><h3>${t(data.hospital.emergency_24h ? "emergencyShort" : "hospitalLine")}</h3>${phoneLink(data.hospital.phone)}</div></div>
        ${data.hospital.email ? `<div class="contact-row">${icon("mail")}<a href="mailto:${escapeHtml(data.hospital.email)}">${html(data.hospital.email)}</a></div>` : ""}
      </div>
    </div></section>${support()}${faq()}`;
}

function bookingNotice() {
  return `<p class="booking-privacy">${escapeHtml(notices[language].booking)} <a href="${href("/privacy/")}">${escapeHtml(notices[language].privacy)}</a></p>`;
}

function legalPage(key) {
  const content = legalPages[key][language];
  return `${innerHeading(html(data.hospital.name), escapeHtml(content.title), escapeHtml(content.intro))}
    <div class="container legal-content"><p class="draft-notice">${escapeHtml(notices[language].draft)}</p>
    ${content.sections.map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`).join("")}
    <nav class="legal-links" aria-label="${escapeHtml(pageTitle())}"><a href="${href("/privacy/")}">${escapeHtml(notices[language].privacy)}</a><a href="${href("/terms/")}">${escapeHtml(notices[language].terms)}</a></nav></div>`;
}

function header() {
  const emergency = data.hospital.emergency_24h && validPhone(data.hospital.phone);
  return `<a href="#main" class="skip-link">${statusText[language].skip}</a>
    <div class="topbar"><div class="container"><span>${icon("map-pin")}${t("location")}</span><span class="top-message">${t("top")}</span>${emergency ? `<a href="tel:${data.hospital.phone}">${icon("heart-pulse")}${t("emergency")}</a>` : ""}</div></div>
    <header class="site-header"><div class="container header-inner">${brand()}
      <nav class="main-nav" id="navigation" aria-label="${escapeHtml(copy("menu"))}">${routes.slice(0, 6).map((route, index) => `<a href="${href(route)}" ${index === page ? 'aria-current="page"' : ""}>${escapeHtml(navigation[language][index])}</a>`).join("")}</nav>
      <div class="header-tools"><label class="language-select">${icon("languages")}<select id="language" aria-label="${escapeHtml(copy("language"))}">${[["en", "EN"], ["hi", "हिंदी"], ["mr", "मराठी"]].map(([value, label]) => `<option value="${value}" ${language === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <div class="header-call">${call()}</div><button class="menu-toggle" data-menu aria-controls="navigation" aria-expanded="false" aria-label="${escapeHtml(copy("menu"))}" title="${escapeHtml(copy("menu"))}">${icon("menu")}</button>
      </div>
    </div></header>`;
}

function footer() {
  return `<footer><div class="container footer-grid"><div>${brand()}<p>${t("footerLine")}</p></div>
    <div><h2>${t("footerNav")}</h2>${[1, 4, 5].map(index => `<a href="${href(routes[index])}">${escapeHtml(navigation[language][index])}</a>`).join("")}</div>
    <div><h2>${t("footerCare")}</h2><a href="${href("/child-care/")}">${t("child")}</a><a href="${href("/dental-care/")}">${t("dental")}</a></div>
    <div><h2>${t("footerContact")}</h2><p>${html(data.hospital.address)}</p><button class="footer-call" data-call>${icon("phone")}${t("call")}</button></div>
    </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${t("rights")}</span><nav class="legal-links" aria-label="${escapeHtml(notices[language].privacy)}"><a href="${href("/privacy/")}">${escapeHtml(notices[language].privacy)}</a><a href="${href("/terms/")}">${escapeHtml(notices[language].terms)}</a></nav></div></footer>
    <div class="mobile-actions">${call()}${data.hospital.emergency_24h && validPhone(data.hospital.phone) ? `<a class="button emergency-call" href="tel:${data.hospital.phone}">${icon("phone-call")}${escapeHtml(notices[language].emergencyCall)}</a>` : link("/contact/", t("visitDetails"), "button mobile-location")}</div>
    <dialog id="call-dialog" aria-labelledby="dialog-title"><button class="dialog-close" data-close aria-label="${escapeHtml(copy("close"))}" title="${escapeHtml(copy("close"))}">${icon("x")}</button><span class="dialog-icon">${icon("phone")}</span><h2 id="dialog-title">${t("dialogTitle")}</h2><p>${t("bookingIntro")}</p>${appointmentLinks()}${bookingNotice()}${emergencyNotice()}</dialog>`;
}

function render() {
  document.documentElement.lang = language;
  document.body.dataset.page = ["home", "about", "child", "dental", "doctors", "contact", "privacy", "terms"][page];
  document.title = `${pageTitle()} | ${text(data.hospital.name)}`;
  document.querySelector('meta[name="description"]').content = copy("careSummary");
  const pages = [home, about, () => department("child"), () => department("dental"), () => `${innerHeading(t("doctorsLabel"), t("doctorPageTitle"), t("doctorPageBody"))}<section class="section doctors-section"><div class="container">${doctorCards()}</div></section>${visit()}`, contact, () => legalPage("privacy"), () => legalPage("terms")];
  app.innerHTML = `${header()}<main id="main" tabindex="-1">${pages[page]()}</main>${footer()}`;
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.7 } });
}

app.addEventListener("click", event => {
  if (event.target.closest("[data-call]")) document.getElementById("call-dialog").showModal();
  if (event.target.closest("[data-close]")) document.getElementById("call-dialog").close();
  const menu = event.target.closest("[data-menu]");
  if (menu) {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    document.getElementById("navigation").classList.toggle("open", open);
    if (open) document.querySelector("#navigation a")?.focus();
  }
  if (event.target.id === "retry") load();
  const dialog = document.getElementById("call-dialog");
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});

app.addEventListener("change", event => {
  if (event.target.id !== "language" || !LANGUAGES.includes(event.target.value)) return;
  const position = scrollY;
  language = event.target.value;
  try { localStorage.setItem("shantipad-language", language); } catch { /* Language works without persistence. */ }
  render();
  document.getElementById("language").focus({ preventScroll: true });
  window.scrollTo({ top: position, behavior: "instant" });
});

app.addEventListener("input", event => {
  if (event.target.id !== "service-search") return;
  const rows = [...document.querySelectorAll("[data-service]")];
  let count = 0;
  for (const row of rows) {
    row.hidden = !matchesSearch(row.dataset.search, event.target.value);
    if (!row.hidden) count += 1;
  }
  document.querySelector(".service-count").textContent = `${count} / ${rows.length}`;
  document.querySelector(".service-empty").hidden = count !== 0;
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const menu = document.querySelector("[data-menu]");
  if (menu?.getAttribute("aria-expanded") === "true") {
    menu.setAttribute("aria-expanded", "false");
    document.getElementById("navigation").classList.remove("open");
    menu.focus();
  }
});

async function load() {
  document.documentElement.lang = language;
  app.innerHTML = `<div class="load-state" role="status"><strong>Shantipad</strong><p>${statusText[language].loading}</p></div>`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL("content.json", root), { cache: "no-cache", signal: controller.signal });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    data = validateContent(await response.json());
    render();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
  } catch {
    app.innerHTML = `<div class="load-state" role="alert"><h1>${statusText[language].error}</h1><p>${escapeHtml(notices[language].emergency)}</p>${phoneLink("+919405644319")}<p><button class="button button-primary" id="retry">${statusText[language].retry}</button></p></div>`;
  } finally {
    clearTimeout(timeout);
  }
}

load();
