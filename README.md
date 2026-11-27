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

## Motion 4.0 — production verification

Netlify root deployment is explicit in netlify.toml. The header has a visible Motion control that defaults to enabled on every fresh page load (including when the OS requests reduced motion) and lets a visitor deliberately enable or disable effects. Each cinematic scene displays a live frame count or a loading/error/paused status. Existing WebP sequences remain intact. Added CSS perspective and pointer tilt (desktop), magnetic CTA buttons (mouse), scroll-drawn SVG flourishes, full-screen native dialog navigation, interactive menu category preview and scroll-driven image masks. The menu is intentionally a concept, not a verified list of products or prices. The production CI step runs the same Chromium browser suite against the actual Netlify URL, waits for Motion 4.0, checks real media HTTP responses, screenshot changes, forward/reverse canvas frames, transitions, navigation and UI. Local and live evidence are stored separately. Physical-device testing and café content approval remain required.

## Motion 4.1

Motion starts enabled on every fresh load. The visitor can pause all motion with the header switch and resume it manually; operating-system preference changes do not override the switch. The setting is intentionally not persisted across reloads. CI exercises default-on with reduced-motion emulation, manual off/on and reload on both local and live Netlify builds. The explicit pause remains available for motion-sensitive visitors.

## Motion 4.2 — Maison Collection

18 concept items in three categories, rotating responsive carousel, manual controls, autoplay pause, touch navigation, vector drink layers, logo and favicon, share metadata, footer legal drafts, consent settings. Prices are null until confirmed. `public/brand/assets.json` is ready:true. All 18 approved generated transparent WebP illustrations, logo variants, app icons and the 1200×630 JPEG social card are committed. The art is illustrative and not a verified product photograph. Native SVG illustrations remain available for layered interaction and fallback. No analytics, marketing tags or third-party embedded media. Legal pages are drafts; provider identity and hosting details require verification. Existing noindex and Motion 4.1 default-on are preserved. CI checks local and live release, actual asset HTTP responses, autoplay/pause, mobile swipe, coffee layer transforms, controls, legal routes and consent persistence.

## Motion 4.4 — reservation prototype

Versioned café cup favicon in SVG, PNG and ICO. Final responsive reservation section supports tables for 1–30 guests, events, and food order enquiries. Frontend only: native validation, no API or email, no persisted form data, full reset and explicitly simulated German success message. Privacy draft updated. Existing menu, brand media and motion default-on retained. Browser checks cover 1, 2 and 30 guests, food enquiry, reset and absence of POST/storage changes.

## Motion 4.5 — Parisian favicon

The approved Mademoiselle emblem is resized directly from the generated artwork to 16, 32 and 64 pixel transparent PNGs, with a matching multi-resolution ICO. Versioned links prevent stale browser icons. The main wordmark, mobile install icons, share card, animations and booking form are unchanged.
