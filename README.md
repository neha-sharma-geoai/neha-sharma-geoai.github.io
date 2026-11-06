# Neha Sharma — Earth AI & GeoAI Research

A standalone, responsive portfolio for Neha Sharma, an Earth AI and GeoAI
research scientist. It uses plain HTML, CSS, and JavaScript with local image
assets; there is no build step.

## Design

- **Opening:** a full-bleed "orbit night" hero with animated topographic
  contours and satellites moving along orbit tracks. A world-map panel pins
  Neha's photo to Gwalior, India (26.2° N, 78.2° E), with a profile strip
  (researcher, author, educator) below it. No square grid patterns are used
  anywhere; backgrounds use contour lines instead.
- **Themes:** Orbit night (default), Aurora, Glacier, and Terra, switched from
  the navigation. The choice is saved in `localStorage` (`geoai-palette-v2`).
  All colours are CSS variables defined per `data-theme` in `styles.css`.
- **Motion:** scroll-reveal and map animations are disabled automatically for
  visitors who prefer reduced motion.

## Section order

1. Hero and impact stats
2. Profile
3. Research focus (Earth AI themes, WCRP Earth-system diagram)
4. Selected research projects and toolkit
5. Publications and co-edited book
6. Experience timeline
7. Teaching and capacity building
8. Recognition and memberships
9. Education and certifications
10. Journey maps
11. GitHub contributions
12. Collaborate / contact

Content is drawn from the CV at `assets/neha-sharma-cv.pdf`. Personal details
such as family names, date of birth, phone number, and membership IDs are
intentionally not published.

## Journey maps

The interactive maps use locally embedded boundary masks for the world and
India. Markers and popups are keyboard accessible. World-map markers are
positioned from latitude and longitude in `script.js` using a Robinson
projection calibrated to the mask.

## Analytics

The production site sends page views to Google Analytics 4 only on
`neha-sharma-geoai.github.io`; local previews are excluded.

## Latest writing

The four article cards (two Medium, two ArcGIS Blog) and their thumbnails in
`assets/blog/` are static, copied from the latest posts on 6 Nov 2026. To
refresh them, update the cards in `index.html` and replace the images.

## GitHub profile

The GitHub section fetches public commit, issue, pull request, and profile
totals from the GitHub REST API as it approaches the viewport. The daily
contribution graph comes from the third-party
`github-contributions-api.jogruber.de` service, which mirrors the public
profile calendar. Organization affiliations are maintained in `index.html`
because the public API does not provide affiliation history.

## Run locally

Open `index.html` in a browser. Update the `?v=` cache keys on the stylesheet
and script references in `index.html` when publishing changes to those assets.

## Publish with GitHub Pages

1. Push this folder to the root of a GitHub repository.
2. In the repository settings, open **Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
