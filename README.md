# SDA Struisbaai Website

Website for the Struisbaai and Bredasdorp Seventh-day Adventist church community. This repository was extracted from the nested `sda-struisbaai-website` app in `cloudkid-labs/sda-tygerberg-website`; its source history is preserved.

Astro static output, React islands, Tailwind CSS, TypeScript, and a Cloudflare Worker.

## Shared SDA site core

This church keeps its own site repository, styling, CMS data, and Worker. It
uses `@cloudkid-labs/sda-church-site-core` for the shared church configuration,
visit map UX, and safe CMS slug/link rules. The richer Struisbaai CMS and member
features remain site-owned because they include church-specific board and
content workflows. `sda-church-site-template` remains the starter for new
churches; this repo adopts its core-package update and build workflow.

GitHub Packages access is required for local installs and Actions. Set
`NODE_AUTH_TOKEN` locally to a token with `read:packages`; in GitHub, either
grant this repository Actions access to the core package or set
`GH_PACKAGES_READ_TOKEN` as both an Actions and Dependabot secret. Do not commit
the token. Enable repository auto-merge and protect `main` with the
`Build Struisbaai site / build` and `Require review for major core updates /
major-core-review` checks.

## Run locally

```sh
nvm use
npm ci
npm run dev
```

Other useful commands:

```sh
npm run build
npm run worker:dev
npm run typecheck
npm test
```

## Deployment status

The `devtest` Worker uses `https://struisbaai-sda.cloudkid.link`. It is a no-index preview with no email or R2 bindings. Run the GitHub Actions workflow manually or push a `devtest-*` tag to deploy the current commit. Set the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` first.

The church confirmed sdastruisbaai.co.za as its production domain, and the default Worker is configured to bind it as a Cloudflare Custom Domain on deployment. The domain must be an active Cloudflare zone without a conflicting CNAME. Contact details, board accounts, social channels, and content also need confirmation before production services are enabled. The extracted site still contains Tygerberg-specific copy and contact values; review and replace those before public launch. Do not add Tygerberg mail addresses, R2 buckets, OAuth accounts, or other infrastructure to this repository.

## Site content

Church-specific content is in `src/data/`; preview-only feature switches are in `src/data/featureFlags.ts`. The extracted copy has not yet been fully adapted for Struisbaai. Treat inherited church names, contact details, social links, and page copy as placeholders until the Struisbaai church confirms them.
