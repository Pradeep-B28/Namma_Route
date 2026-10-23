# Namma Route: Tamil Nadu

Interactive transit pathfinding visualizer across Tamil Nadu.

Find the fastest way across Tamil Nadu. Watch the computer think.

Built by Wrench Wise.

- Live Deployment: https://nammaroute-sigma.vercel.app/
- Automated Demo Reel: https://nammaroute-sigma.vercel.app/?demo=1
- Self-Test Verification: https://nammaroute-sigma.vercel.app/?test=1

---

## Overview

When you search for directions on a map app, you get an instant route. Behind the scenes, the computer runs graph algorithms that evaluate potential routes step by step.

Namma Route opens this black box. It models Tamil Nadu's transit network across all 38 district headquarters and 17 key towns (55 cities in total), linked by road highways, state routes, ghat roads, and railway corridors.

The core highlight is Compare Mode. It executes Dijkstra and A* sequentially on the exact same trip:
- Dijkstra explores radially outward in all directions without knowing where the destination lies.
- A* uses a straight-line coordinate compass to steer exploration directly toward the goal.
- On a journey across Tamil Nadu from Kanyakumari to Chennai in Any mode, Dijkstra evaluates 49 cities. A* evaluates only 16 cities. Both discover the exact same 738-minute fastest route. A* completes the search with 67% less computational work.

---

## Features

- **Interactive State Map:** Hand-crafted SVG map (viewBox 1000 by 1330) showing Tamil Nadu's coastline, highways, state roads, dotted ghat passes, railway lines, and city hierarchy.
- **True Zoom and Pan:** Smooth mouse wheel and pinch zoom from 1x to 4x, drag to pan, and a Reset View button. Zooming adjusts SVG viewBox rather than CSS transforms to preserve exact pointer coordinates.
- **Accurate City Picking:** Tap any city directly on the map or type in search comboboxes with alias support (for example Trichy, Tuticorin, Kovai, Madras). Coordinate picking uses inverse screen matrix transforms.
- **Three Travel Modes:**
  - **Any:** Combines road and rail routes with an accurate 30-minute transfer penalty between modes in the same city.
  - **Road:** Explores road links only.
  - **Train:** Rail links only. Cities without a railway station (such as Kodaikanal) dim to 40% opacity, show a warning toast on tap, and shake horizontally.
- **Three Pathfinding Algorithms:**
  - Fastest Route (Dijkstra)
  - Directional Search (A* with admissible straight-line heuristic)
  - Fewest Stops (Breadth-First Search on city hops)
- **Result Directions:** Clear plain-language step instructions joining consecutive hops of the same transit type (for example, Chennai to Ooty shows taking a train to Mettupalayam, transferring for 30 minutes, and driving up to Ooty).
- **Under the Hood Panel:** Live counter of inspected cities, step-by-step plain-English narration, top 5 priority queue inspection, and playback controls (play, pause, step, speed).
- **Wrench Wise Design System:** Light and dark themes matching wrench-wise.com, smooth sun and moon toggle, 3D card tilt with radial highlights, 3D comparison card flips, and decorative 3-layer parallax background.
- **Smooth Custom Loader:** Draws the Tamil Nadu state outline with gradient stroke and fills a 3-step progress bar during network setup.
- **Self-Test Verification (`?test=1`):** Automated test suite verifying all 8,292 city pairs, network reachability, and heuristic mathematical correctness.
- **Automated Demo Reel (`?demo=1`):** Autonomous showcase loop running Kanyakumari to Chennai with simulated tap waves for social video recording.

---

## Network Architecture

The network models real-world transit considerations using a multi-modal, weighted graph:

- **Cities:** 55 cities (38 district headquarters and 17 key towns).
- **Nodes:** Every city has a road node (`<id>:road`). Cities with a railway station also have a rail node (`<id>:rail`), giving 104 total graph nodes.
- **Edges:**
  - 86 road links (highways, state roads, ghat roads).
  - 60 rail links (mainlines, branch lines, Nilgiri hill railway).
  - 49 transfer edges connecting road and rail nodes in the same city with a 30-minute transfer weight.
  - 390 total directed edges.
- **Distances:** Straight-line kilometers calculated using the haversine formula on real latitude and longitude coordinates with an Earth radius of 6371 km.
- **Heuristic Constant k:** The smallest ratio of link travel time to straight-line distance across all links (k = 1.006192). Because no link travels faster than this ratio, straight-line distance multiplied by k never overestimates remaining travel time, ensuring A* is admissible.

---

## Benchmark Results

The app includes an automated verification test suite checking every pair across all three modes:

| Metric | Result | Target |
|---|---|---|
| Total Pairs Evaluated | 8,292 pairs | All pairs |
| Pathfinding Failures | 0 failures | 0 |
| Road Mode (2,970 pairs) | 100% agreement | 0 failures |
| Rail Mode (2,352 pairs) | 100% agreement | 0 failures |
| Any Mode (2,970 pairs) | 100% agreement | 0 failures |
| Heuristic Constant k | 1.006192 | Diff < 1e-6 |
| Lighthouse Mobile Performance | 93 / 100 | >= 90 |
| Cumulative Layout Shift (CLS) | 0.00 | < 0.05 |
| Best Demo Gap (Kanyakumari to Chennai) | 49 vs 16 cities | 67% less work |

Run the benchmark by appending `?test=1` to the URL or by running `node test-runner.js`.

---

## Project Structure

```
Namma_Route/
├── index.html          Semantic layout, inline loader, and controls
├── styles.css          Design tokens, light/dark themes, and component styles
├── manifest.json       PWA web application manifest
├── sw.js               Service worker cache (version namma-route-v2)
├── test-runner.js      Node.js automated benchmark runner
├── README.md           Project overview and architecture
├── EXPLAINER.md        Student guide to graph algorithms and heuristics
├── REEL_SCRIPT.md      Social media video recording scripts
├── assets/
│   ├── favicon.png     App icon
│   └── logo.png        Wrench Wise branding logo
├── css/
│   └── motion.css      Keyframe animations, reveals, 3D tilt, and parallax
└── js/
    ├── tn-data.js      Tamil Nadu transit data (cities, links, geometry)
    ├── graph.js        Multi-modal graph builder and k constant calculation
    ├── heap.js         Hand-written binary min-heap priority queue
    ├── algorithms.js   Generator implementations of Dijkstra, A*, and BFS
    ├── route.js        Path reconstruction and grouped direction steps
    ├── render.js       SVG map renderer, zoom/pan viewBox, and pin graphics
    ├── animate.js      Step playback and comparison orchestrator
    ├── ui.js           Inputs, dropdowns, Under the Hood narration, and toasts
    ├── motion.js       Loader lifecycle, reveals, card tilt, and parallax RAF
    ├── demo.js         Autonomous reel loop controller
    ├── test.js         Self-test suite for all 8,292 city pairs
    ├── theme.js        Light and dark theme manager with localStorage
    └── main.js         Application bootstrap and controller integration
```

---

## Local Development

This project uses plain HTML5, CSS3, and JavaScript (ES Modules). It requires no build tools, bundlers, CDNs, or npm packages.

### Method 1: Python Static Server

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.

### Method 2: Node Static Server

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
npx serve .
```

---

## Disclaimer

Simplified map for learning. Not official. Distances and times are approximate and do not include waiting for trains or buses.
