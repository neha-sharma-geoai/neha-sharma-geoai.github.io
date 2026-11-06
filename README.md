# Neha Sharma — GeoAI & Earth systems

A standalone, responsive portfolio site for Neha Sharma, designed around
geospatial research, with a parchment, cobalt, teal, and coral palette. A
single researcher-led opening hero unites a world map, portrait, and satellite
orbits, followed by an editorial, map-inspired flow between research, selected
work, publications, and teaching, with map graphics and project artwork as
visual anchors rather than dashboard-like panels. Visitors can
switch between Earth relief, Ocean mist, Canopy, and Lavender from the
palette selector in the navigation; their choice is saved in the browser. The
portfolio also includes selected publications and researcher profiles,
teaching programmes, community service, awards, exam milestones, and a
downloadable CV at `assets/neha-sharma-cv.pdf`, along with public GitHub
profile details and recent activity.

## Journey maps

The interactive maps use locally embedded boundary masks derived from the
supplied India and world references. Their markers and location popups remain
interactive and accessible, with online study and remote work called out in the
location details.

## Analytics

The production site sends page views to Google Analytics 4. Visit totals are
not displayed on the public page and remain available in the private Analytics
account. Tracking runs only on `neha-sharma-geoai.github.io`; local previews
are excluded.

## GitHub activity

The GitHub section fetches public profile details and recent public events
from the GitHub REST API as the section approaches the viewport. It does not
include private contributions or claim an all-time contribution total. API
rate limits and network errors are shown in the section, with a direct link to
the public profile.

## Run locally

Open `index.html` in a browser. The site uses plain HTML, CSS, JavaScript, and
local image assets; it does not require a build step or package installation.
The version query strings on the stylesheet and script references in
`index.html` are cache keys; update them when publishing changes to those
assets.

## Publish with GitHub Pages

1. Push this folder to the root of a GitHub repository.
2. In the repository settings, open **Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.

The site is a static portfolio; update `index.html`, `styles.css`, and
`script.js` directly.
