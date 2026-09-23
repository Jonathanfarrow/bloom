# Hitchin in Bloom

An interactive 3D model of Hitchin town centre showing where flower beds,
planters, window boxes and hanging baskets could go. It's for presenting ideas
to the council, businesses, sponsors and residents.

![Market Place in bloom](docs/market-place.png)

## What it does

- **3D town model**: Market Place, St Mary's Church, the River Hiz, Bancroft,
  Hermitage Road, Sun Street, Windmill Hill, Butts Close and the streets around
  them. Orbit, pan and zoom with the mouse or touch.
- **14 proposed planting sites**, from the Market Place planters to lavender
  rows on Windmill Hill. Each has a description, why it was chosen, care and
  watering needs, planted area and a rough plant count.
- **Five planting schemes** (summer bedding, Hitchin lavender, pollinator
  meadow, spring bulbs, late summer glow). Switch the scheme on any site and
  the flowers regrow in the new colours.
- **In bloom toggle**: compare the town as it is with the town in flower.
- **Tour**: flies between the sites automatically. Good for a presentation
  screen.
- **Suggest a spot**: click anywhere on the map to propose a new site. Ideas
  are saved in the browser and can be copied as text to pass on.
- Dark mode shows the town at dusk with lit windows.
- A link like `…/#windmill-hill` opens straight onto a site.

## Running it

```bash
npm install
npm run dev          # local dev server at http://localhost:5173
npm run build        # static site in dist/ (host anywhere)
npm run build:single # one self-contained HTML file in dist-single/
```

To publish on GitHub Pages, go to **Settings → Pages → Source** and choose
**GitHub Actions**. `.github/workflows/deploy.yml` then builds and deploys
every push to `main`.

## Editing the sites and schemes

All content lives in two data files, so no 3D knowledge is needed:

- `src/data/sites.js`: the planting schemes (plants, colours, heights, mix)
  and the sites (name, text, location and shape of each bed or container).
- `src/data/town.js`: the street layout, river, parks and landmarks.

Coordinates are in metres, with the origin in the middle of Market Place.
`x` runs east and `z` runs **south** (north is negative `z`).

## About the model

The town is a **stylised, approximate** model. Streets and landmarks are placed
by hand from memory of the town's layout, and ordinary buildings are generated
procedurally along the streets. It is meant to give the feel of Hitchin, not
to be a survey. The planting sites are proposals only.

A natural next step is to replace the hand-drawn layout with real building
footprints and heights from OpenStreetMap (© OpenStreetMap contributors, ODbL),
e.g. by exporting the town centre with the Overpass API and converting it to
the same shapes used in `src/data/town.js`.

## Tech

[Three.js](https://threejs.org/) + [Vite](https://vitejs.dev/). The flowers are
GPU-instanced (about 45,000 plants), with a small shader for the growing and
swaying animation. There's no backend.
