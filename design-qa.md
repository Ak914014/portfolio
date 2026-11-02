# Mickey Mouse character update QA

Replaced the original human loader with `src/mickey-character.js`, using the existing Three.js runtime and preserving the scene's reveal, camera path and flight rig. The local model is CappyAdams' Mickey Mouse, credited in the footer and `public/models/mickey-mouse.LICENSE.txt` under its CC BY-NC 4.0 asset license.

Validation:

- The converted GLB is 1,757,548 bytes, with 24,624 triangles, three meshes, two embedded textures and 85 joints. It has no external dependencies or required compression extensions.
- Reimported and rendered the exported GLB in Blender with source embedded scripts disabled. Colors and geometry are visible in `../evidence/mickey-model-preview.png`; conversion metrics are in `../evidence/mickey-model-metadata.json`.
- Actual GLB skeleton/geometry checks with the bundled Three.js math passed: relaxed hands sit below the shoulders, flight opens the arms, all joint transforms and effect landmarks stay finite under a rotated/translated parent, and the torso remains centered despite the tail.
- Material preservation, normalization, transformed bounds and loading-failure handling were checked. The original human GLB is no longer referenced by the experience.
- Production build and all four existing worker tests passed. The production-build model checksum matches the source, and local model, module and credit routes return HTTP 200.
- Browser inspection initially identified the existing preview, but the UI tool blocked the reload because it could not confidently verify the active URL. Final in-scene visual and interaction verification remains incomplete; offline model rendering and source/runtime-math checks passed.

## Previous Ajay Kumar content update QA

Updated the portfolio from `AJAY_KUMAR_CV_Draft.pdf`: identity, profile, skills, four projects, education, contact links and resume download. Six scene IDs and four project slots are preserved. Original project images and portrait are no longer referenced by the page. The draft's incomplete employment, date and LinkedIn fields are omitted.

Validation for this content update:

- Production build passed; the retained graphics bundle still produces Vite's size advisory.
- All four existing Sites worker tests passed. Required client, server and hosting build outputs exist.
- Both JavaScript modules pass Node syntax checks; independent resume/source review found no unsupported claims or incorrect contributor roles.
- All eight new project summary SVGs are valid, self-contained XML. Offline raster review found no clipped or overlapping text; contact sheet: `../evidence/ajay-project-summary-review.png`.
- The preview at http://127.0.0.1:4173/ returns the updated page and all new asset routes successfully. The downloaded resume's checksum matches the supplied PDF.
- Current browser visual and interaction checks could not be completed: Computer Use stopped because it could not confidently determine the active browser URL on Windows. The historical browser results below apply to the previous reference content only.

## Historical reference recreation QA

final result: passed

## Findings

No actionable P0, P1, or P2 fidelity differences. No visual repair iteration was needed. The page structure, original stylesheet, compiled graphics runtime, and 22 original assets are retained. Media paths resolve locally and analytics scripts are omitted.

## Capture conditions and evidence

Source: https://ysuriadesign.co/. Implementation: http://127.0.0.1:4173/.

Source screenshots: `../evidence/source-*.png`. Implementation screenshots: `../evidence/local-*.png`.

Both versions used the same Chromium engine, desktop 1440 × 900 CSS pixels and touch/mobile 390 × 844 CSS pixels, device scale factor 1. PNG pixel dimensions equal CSS dimensions. Paired desktop sheets downsample both sides equally; mobile and focused modal comparisons preserve native resolution.

States compared: entry loader, hero, six chapters, finale, four project galleries, gallery media changes, and footer. Timeline helpers selected equivalent scene positions for screenshot capture; interaction checks used visible controls. The complete source scroll was also captured on both sizes.

Full-view paired evidence:

- `../evidence/comparison-desktop-hero.jpg`
- `../evidence/comparison-mobile-hero.jpg`
- `../evidence/comparison-desktop-sections.jpg`
- `../evidence/comparison-mobile-sections.jpg`
- `../evidence/comparison-desktop-end.jpg`
- `../evidence/comparison-mobile-end.jpg`

Focused/readable interface evidence:

- `../evidence/comparison-desktop-modal-detail.jpg`
- `../evidence/comparison-mobile-project-0.jpg`
- `../evidence/comparison-desktop-project-0-next.jpg`
- `../evidence/comparison-mobile-project-3.jpg`

Both source and implementation were inspected together in these comparison images. Independent review: `../evidence/visual-comparison-review.md`.

## Required fidelity surfaces

- **Typography:** Original local Geist font. Weights, sizes, line heights, tracking, text wrapping, headings and interface copy match. Chapter animation blurs/reveals text in both versions.
- **Spacing and layout:** Header gutters, portrait, index, chapter rail, hero text, bottom controls, modal dimensions/padding/radii, media aspect ratios and footer match. No horizontal overflow at either viewport.
- **Colors and tokens:** Original black, warm white and red-orange palette retained, including environment colors, border opacity, glow and glass surfaces.
- **Asset quality:** Original portrait, project images/videos, font, soundtracks and 3D model are local. No substitute assets. All 22 routes return HTTP 200 with original file sizes.
- **Copy:** Original page, chapter, project and footer text preserved. No implementation notes or prompt text added to the interface.

## Interaction and runtime verification

`../evidence/local-verification.json` records 14 passing groups across desktop and mobile: sound/muted entry, sound toggle, all four gallery open/next/previous/thumbnail/close flows, Escape close, chapter navigation, return to start, footer return and overflow checks. No browser page errors occurred.

`../evidence/local-assets-check.json` confirms all 22 asset routes and no external runtime requests. Same-origin blob resources decode the model. Canceled video requests during gallery switching also occur in the source and are not missing assets.

Production build passed with `npm.cmd run build`. Vite reports the expected size advisory for the preserved graphics bundle. The local preview is running and open.

## Comparison history and limits

The first paired visual comparison passed; no application changes were needed in response. Named timeline captures improved source capture consistency before QA.

Particles, grass, noise, figure pose, video frames and footer camera vary with animation timing. These expected differences do not change layout. Testing used Chromium and mobile emulation, not physical phones or every browser. WebGL2 requirements, dense mobile index and source modal focus behavior are inherited. Audio controls and media delivery were checked; perceived audio quality was not measured.

## Implementation checklist

- [x] All original assets served locally; analytics removed.
- [x] Desktop/mobile and focused visual comparison complete.
- [x] Core interactions and browser errors checked.
- [x] Production build complete.
- [x] Preview running and open.

No additional P3 visual refinements are required for this recreation.
