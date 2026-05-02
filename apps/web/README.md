# Limitrum Website

Official website for Limitrum: https://limitrum.com

The site includes canonical metadata, Open Graph/Twitter cards, structured data, `robots.txt`, `sitemap.xml`, a web manifest, and favicon assets for the public domain.

This app is a Vite, React, and Tailwind CSS site deployed to Firebase Hosting.

## Local Development

```bash
pnpm --filter @limitrum/web dev
```

## Production Build

```bash
pnpm --filter @limitrum/web build
```

The production output is generated in `apps/web/out` and served by Firebase Hosting.
