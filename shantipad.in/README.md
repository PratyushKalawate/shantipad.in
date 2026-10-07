# Shantipad Hospital Website

A standalone, multi-page static website for Shantipad Paediatric & Dental Hospital, Shegaon, with English, Hindi and Marathi content and call-to-book appointments.

This edition does not need Python, a database or a running API. There is no online admin panel, patient account, payment system or appointment form. The original Django project is preserved separately and is not part of this package.

## Start Here

See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub upload, GitHub Pages and optional GoDaddy domain setup. This package prepares a deployment; it does not create a repository, publish the site or change DNS by itself.

**Hosting policy:** Technical compatibility does not mean every use is permitted. GitHub Pages restricts hosting an online business and sites primarily facilitating commercial transactions. Review its [usage policy](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) before using it as the hospital's production website. The same static output can be hosted elsewhere without restoring Python.

## Local Development

Install Node.js 24. No npm dependencies need to be installed.

```sh
npm test
npm run build
npm run preview
```

Open the local URL printed by the preview command. Do not open `index.html` directly from Finder: browsers need HTTP to load the content and JavaScript modules correctly.

## Structure

| Location | Purpose |
| --- | --- |
| `index.html` and page folders | Directly addressable page entry points |
| `content.json` | Public hospital information and translations |
| `static/app.js` | Page rendering and interactions |
| `static/legal-content.mjs` | Privacy and terms drafts in all three languages |
| `static/ui-utils.mjs` | Shared formatting, validation and URL helpers |
| `static/styles.css` | Responsive layout and presentation |
| `static/assets/` | Public website images |
| `scripts/` | Dependency-free build and preview tools |
| `tests/` | Automated checks |
| `.github/workflows/pages.yml` | Test, build and GitHub Pages deployment |
| `dist/` | Generated public website; do not edit by hand |

## Content Changes

Edit `content.json`, keeping its JSON structure and English, Hindi and Marathi translations intact. Add only approved public images under `static/assets/`. Run tests, build and preview, then commit the source changes to `main`. GitHub Actions rebuilds and republishes after successful checks.

The build publishes an explicit set of public files. It does not publish this README, development tools or tests. Keep that boundary intact when extending the site.

## Privacy and Publication

- Everything in `content.json` and the static assets is public, even when it is not currently visible on a page.
- Obtain the hospital's approval for the logo, doctor information, contact numbers, translated copy and photographs before publishing a public repository or website.
- Do not add certificates, credentials, private correspondence, patient information, database files or admin backups to this repository.
- Do not paste passwords or tokens into the content or JavaScript. This website has no place for secrets.
- Telephone buttons open the visitor's calling app. They do not record or confirm an appointment.
- Missing photography is labeled `[REAL PHOTO NEEDED]`. No stock or generated photographs are published.
- Privacy and terms are available at `/privacy/` and `/terms/`, with footer links on every page. They are drafts, not a claim of legal compliance. Replace `[ADD REAL DATA]` fields and obtain the hospital's legal/content approval before launch.
- Missing doctor registration numbers are marked `[ADD REAL DATA]`. Do not publish those placeholders as confirmed credentials.
- This version makes no external font requests and has no analytics, cookie banner, payment collection or patient form. Language preference is saved locally in the visitor's browser. Review these facts again if integrations are added.
- See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for the design-rule review and outstanding publication steps.

## Credits

Lucide icons are distributed with their license in [LICENSE-lucide](LICENSE-lucide). Hospital branding and supplied content remain subject to their owners' permissions; a public repository does not grant reuse rights to them.

System fonts are used. Only the supplied hospital logo is currently published as an image, including its use as the favicon. An older unused stock image may remain in the working source folder but is excluded from the public build and revised ZIP package.

Search indexing remains disabled with `noindex,nofollow` in all eight page entry points until the client approves a public launch. Remove those meta tags after approval to permit indexing.
