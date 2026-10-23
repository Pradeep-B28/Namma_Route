# Namma Route: Tamil Nadu

Interactive Transit Graph Pathfinding Across Tamil Nadu

Find the fastest route across Tamil Nadu and watch the computer search step by step.

Built by Wrench Wise.

[Live Deployment](https://nammaroute-sigma.vercel.app/) | [Autonomous Demo Reel](https://nammaroute-sigma.vercel.app/?demo=1) | [Self-Test Suite](https://nammaroute-sigma.vercel.app/?test=1)

---

## Highlights at a Glance

| Feature | Specification |
|---|---|
| Coverage | All 38 Tamil Nadu district headquarters and 17 key towns (55 cities) |
| Graph Topology | Multi-modal: 104 nodes, 390 directed edges (road, rail, transfers) |
| Algorithms | Dijkstra (Fastest), A* (Directional), BFS (Fewest Stops) |
| Mathematical Guarantee | Admissible heuristic with constant k = 1.006192 (never overestimates) |
| Test Coverage | 8,292 city-pair queries tested with zero failures |
| Performance | Lighthouse mobile score 93, Cumulative Layout Shift 0.00 |
| Dependencies | Zero external libraries, zero CDNs, pure vanilla JavaScript (ES modules) |

---

## Why Namma Route?

When you search for travel directions on commercial map apps, you see an instantaneous route line. The complex computation behind that line remains invisible.

Namma Route opens the black box of transit pathfinding. It models the actual geography of Tamil Nadu as a multi-modal mathematical graph. It lets students, developers, and travelers observe graph search algorithms in real time.

You can watch Dijkstra explore every direction blindly, or see A* use coordinate heuristics to cut through the state directly to the destination.

---

## Live Comparison: Dijkstra vs A*

In Compare Mode, both algorithms run sequentially on the exact same trip. Here is how they perform on sample journeys:

### Trip 1: Kanyakumari to Chennai (Full State North-South Corridor)
- Mode: Any (Road and Rail)
- Ground Truth Fastest Time: 738 minutes (12 hours 18 minutes)
- Dijkstra Inspected: 49 cities (explores across western and southern districts)
- A* Inspected: 16 cities (follows the direct eastern railway mainline)
- Search Reduction: 67% fewer nodes inspected by A*

### Trip 2: Coimbatore to Nagapattinam (West to East Coast Corridor)
- Mode: Road
- Ground Truth Fastest Time: 345 minutes (5 hours 45 minutes)
- Dijkstra Inspected: 28 cities
- A* Inspected: 11 cities
- Search Reduction: 61% fewer nodes inspected by A*

### Trip 3: Tirunelveli to Vellore
- Mode: Any
- Ground Truth Fastest Time: 580 minutes (9 hours 40 minutes)
- Dijkstra Inspected: 37 cities
- A* Inspected: 14 cities
- Search Reduction: 62% fewer nodes inspected by A*

Both algorithms always discover the exact same fastest route. A* reaches the answer with significantly less computational work.

---

## Core Features

### 1. Hand-Crafted Tamil Nadu Transit Map
- Scaled vector geometry rendered inside a 1000 by 1330 SVG viewport.
- Shows district headquarters, junctions, hill stations, coastlines, highways, state roads, and railway corridors.
- Distinct dotted styling for western ghat mountain passes (for example, Mettupalayam to Ooty, Bodi to Bodimettu, and Theni to Munnar).
- Clear visual hierarchy with Tier 1 regional hubs, Tier 2 district capitals, and Tier 3 local towns.

### 2. Precise ViewBox Zoom and Pan
- Zoom range from 1x to 4x using mouse wheel, pinch gestures, or on-screen controls.
- Smooth click-and-drag panning across the entire state.
- Dynamic zoom adjusts the SVG viewBox instead of CSS transforms, preserving exact pixel coordinates for clicks.
- Coordinate picking uses inverse screen matrix transforms (getScreenCTM) to ensure taps select the intended city at any zoom level.

### 3. Multi-Modal Travel Modes
- Any Mode: Combines highway driving and express railway corridors with a realistic 30-minute transfer penalty when switching modes at the same station.
- Road Mode: Restricts travel to national highways, state highways, and mountain passes.
- Train Mode: Restricts travel to railway lines. Cities without a railway station (such as Kodaikanal) dim to 40% opacity, shake horizontally on tap, and display an informative toast.

### 4. Step-by-Step Route Narration
- Automatically groups consecutive hops of the same transit type into clear travel instructions.
- Example trip from Chennai to Ooty:
  1. Board train at Chennai Central to Mettupalayam via Salem and Erode.
  2. Transfer at Mettupalayam (30 minutes).
  3. Drive up the Nilgiri Ghat Road from Mettupalayam to Ooty.

### 5. Under the Hood Inspection
- Real-time counter of inspected cities and frontier nodes.
- Step-by-step narration explaining why the algorithm selected each specific city.
- Priority queue inspector displaying the top 5 candidates with their current f-costs.
- Playback controls: play, pause, single-step forward, and four speed settings (0.5x, 1x, 2x, 4x).

### 6. Wrench Wise Design System
- Built to match the aesthetic of wrench-wise.com.
- Zero-flash theme switcher supporting both dark and light modes with localStorage persistence.
- 3D card tilt with mouse-tracking radial gradients.
- Smooth 3D flip animations on comparison cards.
- Custom state outline loader with a three-step network bootstrap progress bar.

---

## Graph Theory and Mathematics

### Multi-Modal Graph Model
Transit networks cannot be modeled as simple 2D graphs because transferring between train and car takes time.

To solve this, Namma Route splits each city into mode-specific nodes:
- Every city has a road node (`<id>:road`).
- Cities with train access also have a rail node (`<id>:rail`).
- A 30-minute bidirectional transfer edge connects `<id>:road` and `<id>:rail` in the same city.

This yields:
- 55 total cities
- 104 graph nodes
- 390 directed edges (86 road links, 60 rail links, 49 transfer pairs)

### Admissible Heuristic (A* Guarantee)
For A* search to guarantee the optimal fastest route, the heuristic function h(n) must never overestimate the true remaining travel time to the destination.

1. Straight-Line Distance: Calculated using the Haversine formula on spherical coordinates (Earth radius = 6371 km).
2. Network Speed Limit: We scan all 146 links to find the maximum possible travel speed across the network. The fastest link yields a minimum travel time ratio of k = 1.006192 minutes per kilometer.
3. Heuristic Formula: `h(n) = haversine_distance(n, goal) * k`.
4. Proof of Admissibility: Because no road or train link can move faster than 1 / k km/min, `h(n)` is strictly less than or equal to the actual travel time `d(n, goal)` for all nodes. This ensures A* is mathematically admissible and always optimal.

---

## Verification and Quality Benchmarks

Namma Route includes an in-browser and headless test suite that tests every single city-pair permutation:

| Benchmark Check | Result | Standard |
|---|---|---|
| Total City Pairs Tested | 8,292 pairs | Complete coverage |
| Pathfinding Success Rate | 100% (0 failures) | Zero missing routes |
| Dijkstra vs A* Optimality Agreement | 100% identical times | Absolute optimality |
| Any Mode Reachability | 2,970 pairs verified | 100% reachable |
| Road Mode Reachability | 2,970 pairs verified | 100% reachable |
| Rail Mode Reachability | 2,352 pairs verified | Subgraph connected |
| Heuristic Admissibility Margin | k = 1.006192 | Diff < 1e-6 |
| Lighthouse Mobile Performance | 93 / 100 | Target >= 90 |
| Cumulative Layout Shift (CLS) | 0.00 | Target < 0.05 |
| Accessibility Contrast Ratio | 0 failures | WCAG AA compliant |

Run the test suite in your browser by visiting `?test=1` or run `node test-runner.js` in your terminal.

---

## Repository Structure

```
Namma_Route/
├── index.html          Main application markup, SVG layout, and loader
├── styles.css          Design tokens, light/dark themes, and card layouts
├── manifest.json       Progressive Web App manifest
├── sw.js               Service worker cache (version namma-route-v2)
├── test-runner.js      Node.js automated benchmark runner (8,292 pairs)
├── README.md           Project architecture and technical documentation
├── EXPLAINER.md        Student teaching guide for graph search algorithms
├── REEL_SCRIPT.md      Demo video recording scripts and narration
├── assets/
│   ├── favicon.png     Application favicon
│   └── logo.png        Wrench Wise project logo
├── css/
│   └── motion.css      Keyframe animations, reveals, 3D tilt, and parallax
└── js/
    ├── tn-data.js      Tamil Nadu transit data (55 cities, 146 links, SVG paths)
    ├── graph.js        Multi-modal graph builder and k constant calculation
    ├── heap.js         Hand-written binary min-heap priority queue
    ├── algorithms.js   Generator implementations of Dijkstra, A*, and BFS
    ├── route.js        Path reconstruction and grouped direction steps
    ├── render.js       SVG map renderer, zoom/pan viewBox, and pin graphics
    ├── animate.js      Step playback and comparison orchestrator
    ├── ui.js           Inputs, comboboxes, Under the Hood narration, and toasts
    ├── motion.js       Loader lifecycle, reveals, card tilt, and parallax RAF
    ├── demo.js         Autonomous demo reel loop controller
    ├── test.js         In-browser self-test suite for all 8,292 pairs
    ├── theme.js        Light and dark theme manager with localStorage
    └── main.js         Application bootstrap and controller integration
```

---

## Local Development

Namma Route has zero external dependencies. You do not need npm, webpack, or any build step.

### Quick Start with Python

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
python -m http.server 8080
```
Open `http://localhost:8080` in any modern web browser.

### Quick Start with Node

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
npx serve .
```

---

## Special Query Modes

- `/?demo=1`: Runs an autonomous looping demo from Kanyakumari to Chennai in Any mode with simulated tap ripples. Ideal for showcases and video recording.
- `/?test=1`: Runs the automated test suite directly inside the browser console and displays a summary table.

---

## Disclaimer

Simplified map for learning. Not official. Distances and times are approximate and do not include waiting for trains or buses.
