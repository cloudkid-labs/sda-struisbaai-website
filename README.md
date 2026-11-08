# SDA Struisbaai Website

Website for the Struisbaai and Bredasdorp Seventh-day Adventist church community. This repository was extracted from the nested `sda-struisbaai-website` app in `cloudkid-labs/sda-tygerberg-website`; its source history is preserved.

Astro static output, React islands, Tailwind CSS, TypeScript, and a Cloudflare Worker.

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

Production deployment is not configured. The church's production domain, contact details, board accounts, social channels, and content need confirmation before production services are enabled. The extracted site still contains Tygerberg-specific copy and contact values; review and replace those before public launch. Do not add Tygerberg mail addresses, R2 buckets, OAuth accounts, or other infrastructure to this repository.

## Site content

Church-specific content is in `src/data/`; preview-only feature switches are in `src/data/featureFlags.ts`. The extracted copy has not yet been fully adapted for Struisbaai. Treat inherited church names, contact details, social links, and page copy as placeholders until the Struisbaai church confirms them.
