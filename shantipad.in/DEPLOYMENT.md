# Publish the Static Website

This version works without a backend or online admin. The steps below are instructions for the account owner; no GitHub repository, hosting or domain configuration has been created by this package.

Before launch, read [GitHub Pages' usage policy](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Pages restricts online-business hosting and sites primarily facilitating commercial transactions. For the actual hospital website, confirm eligibility with GitHub or use another static host. The `dist` output is portable.

## 1. Upload the Project

1. Extract the new static website ZIP. Do not use the older Python ZIP.
2. Sign in to [GitHub](https://github.com/new) and create a public repository, for example `shantipad-website`, with `main` as its default branch.
3. Use **Add file > Upload files** (or **uploading an existing file** in an empty repository).
4. Open the extracted website folder. On macOS, press **Command + Shift + .** to reveal hidden files.
5. Upload the folder's **contents**, including `.github` and `.gitignore`. Do not upload the ZIP, the enclosing folder or generated `dist` folder.
6. Commit the files to `main`. Confirm `index.html`, `content.json`, `package.json` and `.github/workflows/pages.yml` are at the repository's expected paths.

Use GitHub Desktop if browser folder uploads miss hidden files. Never upload the old project's database, private folder, certificates or admin login file. See GitHub's [file upload guide](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## 2. Enable GitHub Pages

1. Open the repository's **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Open **Actions > Test and deploy static website > Run workflow**, choose `main`, and run it. The first automatic run may have failed if Pages had not yet been enabled; rerun it now.
4. Wait for the `build` and `deploy` jobs to succeed. The deployment provides the website URL.
5. Test every page, all three languages, the mobile menu and call buttons at that URL before adding a domain.

The workflow tests pull requests but deploys only `main`. It publishes the generated `dist` folder, not the repository. It uses GitHub's built-in deployment token; no personal access token or account password is needed. If the default branch is not `main`, rename it or update both branch filters and deployment conditions in the workflow. See [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 3. Verify Domain Ownership

Do this before pointing `shantipad.com` at GitHub.

1. Open your **GitHub profile Settings > Pages > Add a domain**. This is account settings, not repository settings.
2. Enter `shantipad.com`.
3. GitHub displays a unique TXT record name and value. Add that exact record in **GoDaddy > Domain Portfolio > shantipad.com > DNS**.
4. Return to GitHub and select **Verify** when the record is visible. Keep the TXT record afterward.

Do not invent the TXT value or share account passwords. Organization-owned repositories use the organization's Pages settings. See [GitHub's domain-verification guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).

## 4. Connect shantipad.com

First, set **repository Settings > Pages > Custom domain** to `shantipad.com` and save. This Actions-based workflow does not require a `CNAME` file in the repository.

In GoDaddy DNS, configure:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `YOUR-GITHUB-USERNAME.github.io` |

Replace `YOUR-GITHUB-USERNAME` with the repository owner's actual username or organization. The CNAME target must not include `https://` or a repository name. GitHub redirects `www` to the configured apex domain when both records are correct. See [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Review existing records before changing them. Replace conflicting parking records for `@` and `www`, but preserve email records such as MX, SPF, DKIM and DMARC and the ownership TXT record. Remove conflicting old website IPv6 records or replace them using GitHub's documented IPv6 values. Do not add wildcard records or change nameservers just for this setup.

GoDaddy's guides explain [A records](https://www.godaddy.com/help/add-an-a-record-19238) and [CNAME records](https://www.godaddy.com/help/add-a-cname-record-19236). If another provider manages the domain's nameservers, edit the records there instead. DNS updates can take up to 48 hours.

## 5. Finish and Maintain

Enable **Enforce HTTPS** in repository Pages settings once available. Check both `https://shantipad.com` and `https://www.shantipad.com`, including direct links to inner pages. Do not announce launch until they load securely and the client has approved the content.

For later changes, update the source files and commit to `main`. Check that the next deployment succeeds. Editing the old local Django admin does not update this standalone version automatically.

If moving the website away from Pages, update DNS and the repository's custom-domain setting together so the domain is not left pointing at an unused Pages site. Keep domain registration and renewal with GoDaddy; no domain transfer is required.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No workflow in Actions | `.github/workflows/pages.yml` was uploaded, without an extra outer folder. |
| Pages configuration error | Pages source is set to GitHub Actions and the workflow ran from `main`. |
| Test or build job fails | Open the first failed step; fix the source error before deploying. |
| Blank page or content error | `content.json` and `static` files exist in the deployed artifact; use an HTTP URL, not a file URL. |
| Domain shows GoDaddy parking | Check existing `@`/`www` records and allow DNS to update. |
| HTTPS is unavailable | Wait for domain verification and certificate provisioning; review conflicting DNS records. |

Official hosting and DNS references were checked on 5 October 2026. Provider interfaces and requirements may change.
