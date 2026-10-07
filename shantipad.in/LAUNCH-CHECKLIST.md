# Launch Checklist

This checklist distinguishes the local static website from an approved, public hospital website. It is not a compliance certificate or legal advice.

## Local Website

| Item | Status | Evidence or next action |
| --- | --- | --- |
| Existing hospital information | Confirmed content retained | Murarka College Road address, hospital and appointment numbers, daily hours, and doctor experience are checked by automated tests. The hospital must approve the final wording. |
| Static hosting | Local package only | There is no online admin, payment system, patient account, or patient-data form. A public deployment has not been verified. |
| Privacy and terms pages | Added locally; hospital approval required | `/privacy/` and `/terms/` have English, Hindi and Marathi content and shared footer links. Automated checks verify their inclusion in the public build. They contain `[ADD REAL DATA]` placeholders and are not approved final policies or confirmed publicly live. |
| Hospital favicon | Added and source-checked | Each of the eight entry pages uses the supplied `hospital-logo.jpeg`, not a generated logo. |
| AI branding and tracking | Source checks pass | No AI branding or known tracking scripts were found in the public source checked by the tests. Do not add analytics, advertising pixels, chat widgets or external embeds without a separate review. |
| Photography | Stock hero excluded from publication | The hero image field is empty and the build excludes `family-care.jpg`. No doctor photos are published. Use only real hospital and doctor photos after the hospital has approved both publication and consent. |
| Language and mobile checks | 72 browser checks passed | All eight pages checked in English, Hindi and Marathi at 1440px desktop and 390px mobile widths; 24 additional checks at 320px verified no horizontal overflow or clipped controls and usable emergency buttons. One H1, matching language, no broken images, and both footer policy links verified at the main sizes. The menu and call dialog close with Escape and restore focus. Telephone targets were inspected, not dialed. |
| Accessibility | Not certified | Automated checks do not establish full WCAG compliance. Check keyboard navigation, screen-reader names, focus, zoom, mobile target sizes, and the translated pages manually. |

Source verification on 6 October 2026: all 37 automated tests passed, including eight design, content, legal-page and public-output checks. These results do not establish that the domain is connected, that a deployment is live, or that the draft policies have received hospital approval.

## Requested Rules

| Rule | Review result |
| --- | --- |
| Cristiano Belz format | No reference supplied; user confirmed proceeding for Shantipad without one. Original patient-first layout used. No claim to reproduce a specific designer's work. |
| No purple gradients | Pass. No CSS gradients. White, muted green, coral and neutral surfaces. |
| No pill buttons | Pass. Rectangular action buttons have a 6px radius. Circular branding is the supplied hospital logo, not a button treatment. |
| No emoji icons | Pass. Self-hosted Lucide line icons used consistently. |
| No em dashes in copy | Pass. Hospital and legal copy checked. |
| No elaborate scroll animation | Pass. No scroll listeners, scroll-triggered effects, keyframe animations or smooth scrolling. Hover color transitions are 180ms. |
| No cursor effects | Pass. Native cursors only. |
| Plain hero: what and for whom | Pass. Names the hospital, pediatric care for children and dental care for families in Shegaon. |
| No fake reviews, testimonials or customer counters | Pass. None published. Service counts derive from the real supplied service list. |
| No invented metrics | Pass. Only supplied experience, hours and contact details retained. No success rates or outcome statistics. |
| No generated photos | Pass. Photo areas use `[REAL PHOTO NEEDED]`; no stock or generated photographs are in the public build. |
| Short, specific copy | Pass. Promotional slogans replaced with department names, service information and telephone appointment instructions. |
| Unknown facts use placeholders | Pass with launch blockers. Doctor registration and unknown legal details use `[ADD REAL DATA]`; none are asserted as facts. |
| Privacy and terms with footer links | Implemented locally in all three languages. Drafts require approval and are not publicly deployed. |

No design/content-rule violations were found in this review. Incomplete launch items are the custom domain, public deployment, real photos, missing verified details and legal approval. This is not a complete legal or accessibility audit.

## Hospital Approval Required

- [ ] Confirm the hospital's legal operating name and ownership details.
- [ ] Supply and approve the hospital registration number and each doctor's council registration number.
- [ ] Confirm qualifications, specialty, services, doctor experience, opening hours and the 24-hour emergency claim.
- [ ] Confirm the current empanelment list and the conditions for cashless treatment.
- [ ] Approve the hospital logo and any future doctor or patient photography. Do not publish patient images without valid written permission.
- [ ] Name the person responsible for privacy questions and provide a working contact channel.
- [ ] Review the draft privacy and terms text against actual reception, telephone, record-keeping and hosting practices.
- [ ] Resolve every approval placeholder or unconfirmed detail before calling the website launch-ready.
- [ ] Approve Marathi and Hindi translations with a fluent reviewer.

## Hosting and Domain

| Item | Status | Next action |
| --- | --- | --- |
| GitHub repository | Unknown | Confirm the correct repository and review all files before making it public. |
| GitHub Pages deployment | Not verified | Run the workflow and check the resulting public address. A local build is not a public deployment. |
| `shantipad.com` | Not connected by this task; current DNS unverified | Domain ownership was reported by the user. No live domain or DNS check has been made for this checklist. Connect it only after selecting and approving the hosting provider. |
| HTTPS | Not verified publicly | Verify the certificate and HTTPS redirect on the deployed domain. Local HTTP previews do not test this. |
| Hosting-policy eligibility | Requires review | Confirm that the chosen host permits the hospital's intended use. Technical support for static files alone is not approval of the use case. |
| Search indexing | Approval gate remains | Retain `noindex,nofollow` until the hospital approves publication. Remove it from all page entries only after launch approval. |

## Final Release Checks

1. Run `npm test` and `npm run build`.
2. Inspect `dist/`: no patient data, certificates, passwords, private correspondence, database files, admin code, or unapproved photos.
3. Test the deployed site, not only the local preview, on mobile and desktop. Confirm all eight direct page URLs work on refresh.
4. Call-test the published telephone numbers with the hospital and verify the opening hours displayed in all three languages.
5. Confirm the privacy and terms links work on the live site, all approval gaps are resolved, and the hospital has approved the final content.
