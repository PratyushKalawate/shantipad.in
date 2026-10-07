export const LANGUAGES = ["en", "hi", "mr"];

const ESSENTIAL_COPY = {
  en: {
    call: "Call to book",
    menu: "Open navigation",
    close: "Close",
    language: "Choose language",
    searchServices: "Search services",
    noServiceResults: "No matching services. Please call the hospital for help.",
    appointmentLine: "Appointment line",
    hospitalLine: "Hospital number",
    visitDetails: "Plan your visit",
    bookingUnavailable: "Please contact the hospital to arrange your visit.",
  },
  hi: {
    call: "बुकिंग के लिए कॉल करें",
    menu: "मेन्यू खोलें",
    close: "बंद करें",
    language: "भाषा चुनें",
    searchServices: "सेवाएँ खोजें",
    noServiceResults: "कोई संबंधित सेवा नहीं मिली। मदद के लिए अस्पताल में कॉल करें।",
    appointmentLine: "अपॉइंटमेंट के लिए फोन",
    hospitalLine: "अस्पताल का नंबर",
    visitDetails: "अस्पताल आने की योजना बनाएँ",
    bookingUnavailable: "अस्पताल आने का समय तय करने के लिए कृपया अस्पताल से संपर्क करें।",
  },
  mr: {
    call: "नोंदणीसाठी कॉल करा",
    menu: "मेन्यू उघडा",
    close: "बंद करा",
    language: "भाषा निवडा",
    searchServices: "सेवा शोधा",
    noServiceResults: "संबंधित सेवा सापडली नाही. मदतीसाठी रुग्णालयाला फोन करा.",
    appointmentLine: "अपॉइंटमेंटसाठी फोन",
    hospitalLine: "रुग्णालयाचा नंबर",
    visitDetails: "रुग्णालयात येण्याचे नियोजन करा",
    bookingUnavailable: "रुग्णालयात येण्याची वेळ ठरवण्यासाठी कृपया रुग्णालयाशी संपर्क साधा.",
  },
};

export function resolveCopy(copy, language, key) {
  const locale = LANGUAGES.includes(language) ? language : "en";
  for (const table of [copy?.[locale], copy?.en]) {
    const value = table && Object.hasOwn(table, key) ? table[key] : "";
    if (typeof value === "string" && value.trim()) return value;
  }
  const fallback = ESSENTIAL_COPY[locale];
  return Object.hasOwn(fallback, key) ? fallback[key] : "";
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function localizedText(value, language) {
  if (value && typeof value === "object") return String(value[language] || value.en || "");
  return String(value ?? "");
}

export function safeUrl(value, origin) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, origin);
    if (url.username || url.password) return "";
    return url.protocol === "https:" || (url.protocol === "http:" && url.origin === origin) ? url.href : "";
  } catch {
    return "";
  }
}

export function validPhone(value) {
  return typeof value === "string" && /^\+[1-9][0-9]{7,14}$/.test(value);
}

export function appointmentContacts(appointments, hospitalPhone) {
  const bookingNumbers = Array.isArray(appointments) ? appointments.filter(validPhone) : [];
  if (bookingNumbers.length) return bookingNumbers.map(number => ({ number, isHospital: false }));
  return validPhone(hospitalPhone) ? [{ number: hospitalPhone, isHospital: true }] : [];
}

export function formatPhone(value) {
  return String(value).replace(/^(\+91)([0-9]{5})([0-9]{5})$/, "$1 $2 $3");
}

export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase().trim().replace(/\s+/g, " ");
}

export function matchesSearch(text, query) {
  const normalized = normalizeSearch(text);
  return normalizeSearch(query).split(" ").every(term => normalized.includes(term));
}

export function validateContent(data) {
  const collections = ["doctors", "services", "facilities", "partners", "appointments", "hours", "faqs"];
  if (!data?.hospital?.name || !data.copy?.en || collections.some(key => !Array.isArray(data[key]))) {
    throw new Error("Incomplete hospital content");
  }
  return data;
}

export function groupedHours(hours, language) {
  const groups = [];
  for (const entry of hours) {
    const times = localizedText(entry.times, language);
    const note = localizedText(entry.note, language);
    const label = localizedText(entry.label, language);
    const existing = groups.find(group => group.times === times && group.note === note);
    if (existing) existing.labels.push(label);
    else groups.push({ labels: [label], times, note });
  }
  return groups;
}
