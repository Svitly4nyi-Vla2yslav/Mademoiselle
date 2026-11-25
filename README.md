# Mademoiselle Gourmet Café

VS Web Studio – cinematic scrollytelling concept. Not an official café website.

## Local development

Node.js 22 recommended. Run `npm install`, then `npm run dev`. Use `npm run build` for TypeScript and Vite checks, and `npm run preview` to preview the build.

## Media

Place original MP4 files under `media-source/{coffee,breakfast,interior}/{desktop,mobile}.mp4`.
Install FFmpeg and FFprobe on PATH, then run `npm run media:prepare`. Alternatively extract the prepared media package into the repository root. The runtime reads `public/media/{scene}/{variant}/manifest.json`, numbered WebP frames and poster.webp. Original videos are not fetched by the website.

The engine maps scroll progress to the actual manifest's frame count; works in both directions, with a sticky stage, bounded per-scene image cache, lazy loading near the viewport, responsive sources and a reduced-motion poster fallback. Canvas is decorative; content remains ordinary HTML.

## Status

Prototype only. Verify media rights and whether generated scenes match the actual café before public deployment. Prices, contacts, opening hours, legal details and menu are not yet confirmed. Search indexing is disabled intentionally. No automatic deployment configured.

## Checks

Run `npm run build`. Test slow network, reverse scroll, viewport resize, orientation change, mobile Safari and Chrome, keyboard navigation, reduced motion and missing media before release.
