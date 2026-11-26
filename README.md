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

## Media verification and browser smoke test

The six original videos and prepared sequences live at the repository root in `media-source/` and `public/media/` respectively. Do not place them inside another ZIP wrapper folder. Run `npm run media:check` to verify every manifest, numbered frame, poster and source video. Run `npm run build`, `npx playwright install chromium`, then `npm run test:scroll` for a Chromium smoke test with desktop and mobile viewport emulation. It checks actual canvas changes on forward and reverse scrolling, responsive variants, horizontal overflow and reduced-motion fallback. Screenshots are written to `test-results/` and uploaded as a GitHub Actions artifact. Real Android/iOS device checks are still required.

## Cinematic Motion 2.0

Three scroll-driven chapters reuse the existing six responsive media sequences. The Canvas engine still maps native scroll directly to manifest frames; a second layer of normalized progress drives title fade/parallax, camera scale and palette-matched scene fades. No added runtime dependencies or external media/font requests. Reduced motion keeps all copy and posters visible. Fixed navigation and the editorial gallery provide direct access to each chapter. The menu categories are illustrative, not verified offerings. The gallery uses existing concept posters rather than additional unverified dessert images. No public deployment or indexing is enabled.

CI additionally checks title fade, gallery/menu presence, navigation and reduced-motion copy visibility. Visual review on actual devices remains necessary.

## Cinematic Motion 3.0

The coffee chapter opens a scroll-driven circular aperture onto the existing responsive breakfast poster. Breakfast is placed immediately after coffee with a one-viewport overlap to hand off the image. Native scrolling and the six frame sequences are retained; the portal reverses with scroll and is disabled for reduced motion. GSAP also drives independent decorative type and gallery image parallax. The gallery is asymmetrical on desktop and staggered on mobile. Motion version is visible in the footer for deployment diagnosis. No new videos, fonts, dependencies or external assets. The portal is a CSS compositing effect, not a physical 3D camera transition.

## Cinematic Motion 3.1 — Organic Liquid Transition

`src/lib/liquidMask.ts` generates a responsive 80-point liquid outline and a separate, slightly wider crema-colored rim from normalized scroll progress. Multiple harmonics create changing lobes; the geometry accounts for the real viewport aspect ratio and expands beyond every corner at the end. The same progress always produces the same shape, including reverse scroll. The existing breakfast poster is revealed directly over the coffee scene; the native-scroll overlap and handoff are retained. The effect begins at 66% of the coffee chapter. No time-based loop, WebGL, filters, new images, or dependencies. Reduced motion disables both reveal and rim. CI checks the mask, rim, multiple intermediate stages, reverse consistency and screenshots at three points on both viewports. This is a stylized 2D liquid reveal, not a fluid simulation.

The browser smoke test waits for the actual ScrollTrigger bounds, physical scroll offset, applied progress and exact decoded frame before comparing the liquid reveal. Reverse outlines and crema rims must match exactly for identical inputs, or within 2 CSS pixels for fractional mobile scroll rounding. The handoff and reduced-motion checks remain mandatory.
