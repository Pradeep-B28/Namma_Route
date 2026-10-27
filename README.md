<div align="center">

# 🗺️ Namma Route: Tamil Nadu
### *Interactive Multi-Modal Transit Graph Pathfinding & Algorithmic Visualizer*

Find the optimal fastest route across Tamil Nadu and watch graph algorithms search step by step in real time.

[![Live Deployment](https://img.shields.io/badge/Live_App-nammaroute--sigma.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://nammaroute-sigma.vercel.app/)
[![Autonomous Demo](https://img.shields.io/badge/Demo-Autonomous_Reel-06B6D4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://nammaroute-sigma.vercel.app/?demo=1)
[![Self-Test Suite](https://img.shields.io/badge/Test_Suite-8%2C292_Pairs_Passing-22C55E?style=for-the-badge&logo=checkmarx&logoColor=white)](https://nammaroute-sigma.vercel.app/?test=1)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Pradeep--B28%2FNamma__Route-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Pradeep-B28/Namma_Route)
[![Author](https://img.shields.io/badge/Author-Pradeep_B-0B2A45?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pradeepb-2k)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="#-highlights-at-a-glance">Highlights</a> •
  <a href="#-why-namma-route">Why Namma Route</a> •
  <a href="#-live-comparison-dijkstra-vs-a">Dijkstra vs A*</a> •
  <a href="#-core-features">Core Features</a> •
  <a href="#-graph-theory-and-mathematics">Mathematics & Heuristic</a> •
  <a href="#-verification-and-quality-benchmarks">Benchmarks</a> •
  <a href="#-repository-structure">Architecture</a> •
  <a href="#-local-development">Local Setup</a> •
  <a href="#-author--contact">Author & Contact</a>
</p>

</div>

---

## ⚡ Highlights at a Glance

| Feature | Specification |
|---|---|
| **Coverage** | All 38 Tamil Nadu district headquarters and 17 key towns (55 cities) |
| **Graph Topology** | Multi-modal: 104 nodes, 390 directed edges (road, rail, 30m transfer penalties) |
| **Algorithms** | Dijkstra (Fastest Path), A* (Directional Heuristic), BFS (Fewest Transfers) |
| **Mathematical Guarantee** | Admissible Euclidean/Haversine heuristic with constant `k = 1.006192` (never overestimates) |
| **Permutation Coverage** | 8,292 city-pair queries tested with zero failures (100% reachable) |
| **Performance** | Lighthouse mobile performance score 93+, Cumulative Layout Shift 0.00 |
| **Runtime Architecture** | Zero external libraries, zero CDNs, pure Vanilla JavaScript (ES modules) & SVG |

---

## 🧭 Why Namma Route?

When you search for travel directions on commercial map apps, you see an instantaneous route line. The complex computation behind that line remains an invisible black box.

**Namma Route** opens that black box of transit pathfinding:
- Models the actual geography of Tamil Nadu as a multi-modal mathematical graph.
- Lets students, engineers, and travelers observe graph search algorithms in real time.
- Visually explains how **Dijkstra** explores every radius uniformly, while **A*** leverages geographic coordinate heuristics to cut straight through the state toward the destination with up to **67% fewer node inspections**.

---

## ⚔️ Live Comparison: Dijkstra vs A*

In Compare Mode, both algorithms execute sequentially on the exact same trip. Here is how they perform on sample journeys:

### Trip 1: Kanyakumari to Chennai (Full State North-South Corridor)
- **Mode:** Any (Road & Express Rail)
- **Fastest Travel Time:** 738 minutes (12 hours 18 minutes)
- **Dijkstra Inspected:** 49 cities (explores across western and southern districts)
- **A* Inspected:** 16 cities (follows the direct eastern mainline)
- **Search Reduction:** **67% fewer nodes inspected by A***

### Trip 2: Coimbatore to Nagapattinam (West to East Coast Corridor)
- **Mode:** Road
- **Fastest Travel Time:** 345 minutes (5 hours 45 minutes)
- **Dijkstra Inspected:** 28 cities
- **A* Inspected:** 11 cities
- **Search Reduction:** **61% fewer nodes inspected by A***

### Trip 3: Tirunelveli to Vellore
- **Mode:** Any
- **Fastest Travel Time:** 580 minutes (9 hours 40 minutes)
- **Dijkstra Inspected:** 37 cities
- **A* Inspected:** 14 cities
- **Search Reduction:** **62% fewer nodes inspected by A***

> Both algorithms always discover the mathematically identical fastest route. A* reaches the solution with significantly lower memory and compute footprint.

---

## 🎨 Core Features

### 1. Hand-Crafted Tamil Nadu Transit Map
- Scaled vector geometry rendered inside a 1000 × 1330 SVG viewport.
- Illustrates district headquarters, railway junctions, hill stations, coastlines, national highways, and express corridors.
- Distinct dotted styling for western ghat mountain passes (e.g. Mettupalayam to Ooty, Bodi to Bodimettu, Theni to Munnar).
- Clear visual hierarchy with Tier-1 regional hubs, Tier-2 district capitals, and Tier-3 transit junction towns.

### 2. Precise ViewBox Zoom and Pan
- Zoom range from 1x to 4x using mouse wheel, pinch gestures, or on-screen controls.
- Smooth click-and-drag panning across the entire state.
- Dynamic zoom adjusts the SVG viewBox instead of CSS transforms, preserving exact pixel coordinates for click registration.
- Coordinate picking uses inverse screen matrix transforms (`getScreenCTM`) to ensure taps select the intended city at any zoom level.

### 3. Multi-Modal Travel Modes
- **Any Mode:** Combines highway driving and express railway corridors with a realistic 30-minute transfer penalty when switching modes at the same station.
- **Road Mode:** Restricts travel to national highways, state highways, and mountain passes.
- **Train Mode:** Restricts travel to railway lines. Cities without a railway station (such as Kodaikanal) dim to 40% opacity, shake horizontally on tap, and display an informative toast.

### 4. Step-by-Step Route Narration
- Automatically groups consecutive hops of the same transit type into clear travel instructions.
- Example trip from Chennai to Ooty:
  1. Board train at Chennai Central to Mettupalayam via Salem and Erode.
  2. Transfer at Mettupalayam station (30 minutes).
  3. Drive up the Nilgiri Ghat Road from Mettupalayam to Ooty.

### 5. Under the Hood Inspection
- Real-time counter of inspected cities and frontier nodes.
- Step-by-step narration explaining why the algorithm selected each specific city.
- Priority queue inspector displaying the top 5 candidates with their current f-costs.
- Playback controls: play, pause, single-step forward, and four speed settings (0.5x, 1x, 2x, 4x).

### 6. Dynamic Responsive Theme System
- Zero-flash theme switcher supporting both dark and light modes with localStorage persistence.
- 3D card tilt with mouse-tracking radial gradients.
- Smooth 3D flip animations on comparison cards.
- Custom state outline loader with a three-step network bootstrap progress bar.

---

## 📐 Graph Theory and Mathematics

### Multi-Modal Graph Model
Transit networks cannot be modeled as simple 2D graphs because transferring between train and car takes time.

To solve this, Namma Route splits each city into mode-specific nodes:
- Every city has a road node (`<id>:road`).
- Cities with train access also have a rail node (`<id>:rail`).
- A 30-minute bidirectional transfer edge connects `<id>:road` and `<id>:rail` in the same city.

This yields:
- **55 total cities**
- **104 graph nodes**
- **390 directed edges** (86 road links, 60 rail links, 49 transfer pairs)

### Admissible Heuristic (A* Optimality Guarantee)
For A* search to guarantee the optimal fastest route, the heuristic function $h(n)$ must never overestimate the true remaining travel time to the destination:

1. **Straight-Line Distance:** Calculated using the Haversine formula on spherical coordinates (Earth radius = 6,371 km).
2. **Network Speed Limit:** We scan all 146 links to find the maximum possible travel speed across the network. The fastest link yields a minimum travel time ratio of $k = 1.006192$ minutes per kilometer.
3. **Heuristic Formula:** 
   $$h(n) = \text{haversine\_distance}(n, \text{goal}) \times k$$
4. **Proof of Admissibility:** Because no road or train link can move faster than $1 / k \text{ km/min}$, $h(n)$ is strictly less than or equal to the actual travel time $d(n, \text{goal})$ for all nodes. This ensures A* is mathematically admissible and always optimal.

---

## 🧪 Verification and Quality Benchmarks

Namma Route includes an in-browser and headless test suite that tests every single city-pair permutation:

| Benchmark Check | Result | Standard |
|---|---|---|
| **Total City Pairs Tested** | 8,292 pairs | Complete coverage |
| **Pathfinding Success Rate** | 100% (0 failures) | Zero missing routes |
| **Dijkstra vs A* Optimality** | 100% identical times | Absolute optimality |
| **Any Mode Reachability** | 2,970 pairs verified | 100% reachable |
| **Road Mode Reachability** | 2,970 pairs verified | 100% reachable |
| **Rail Mode Reachability** | 2,352 pairs verified | Subgraph connected |
| **Heuristic Admissibility Margin** | $k = 1.006192$ | Diff < $1 \times 10^{-6}$ |
| **Lighthouse Mobile Performance** | 93 / 100 | Target $\ge$ 90 |
| **Cumulative Layout Shift (CLS)** | 0.00 | Target < 0.05 |
| **Accessibility Contrast** | 0 failures | WCAG AA compliant |

Run the test suite in your browser by visiting [/?test=1](https://nammaroute-sigma.vercel.app/?test=1) or run `node test-runner.js` in your terminal.

---

## 📂 Repository Structure

```
Namma_Route/
├── index.html          Main application markup, SVG layout, and loader
├── styles.css          Design tokens, light/dark themes, and card layouts
├── manifest.json       Progressive Web App manifest
├── sw.js               Service worker cache (version namma-route-v2)
├── test-runner.js      Node.js automated benchmark runner (8,292 pairs)
├── LICENSE             MIT Open Source License
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

## 💻 Local Development

Namma Route has zero external dependencies. You do not need npm, webpack, or any build step.

### Quick Start with Python
```bash
# Clone the repository
git clone https://github.com/Pradeep-B28/Namma_Route.git
cd Namma_Route

# Start local server
python -m http.server 8080
```
Open `http://localhost:8080` in any modern web browser.

### Quick Start with Node.js
```bash
npx serve .
```

---

## 🎮 Special Query Modes

- [/?demo=1](https://nammaroute-sigma.vercel.app/?demo=1): Runs an autonomous looping demo from Kanyakumari to Chennai in Any mode with simulated tap ripples.
- [/?test=1](https://nammaroute-sigma.vercel.app/?test=1): Runs the automated test suite directly inside the browser console and displays a summary table.

---

## 📄 License

This project is open-source and released under the **[MIT License](LICENSE)**.

```
Copyright (c) 2026 Pradeep B (Pradeep-B28) & Wrench Wise
```

---

## 👨‍💻 Author & Contact

**Pradeep B**  
*Java & DSA Master Trainer | Full-Stack Architect | Web Platform Engineer*

- 🌐 **Softech Career & Placement Portal:** [reachsoftech.onrender.com](https://reachsoftech.onrender.com/home)
- 🌌 **3D Interactive Developer Portfolio:** [pradeep-b28.github.io/GIT_3D_Portfolio](https://pradeep-b28.github.io/GIT_3D_Portfolio/)
- 💻 **GitHub Profile:** [@Pradeep-B28](https://github.com/Pradeep-B28)
- 💼 **LinkedIn:** [linkedin.com/in/pradeepb-2k](https://www.linkedin.com/in/pradeepb-2k)
- 📧 **Email:** [pradeepbashaa@gmail.com](mailto:pradeepbashaa@gmail.com)

---

## ⚠️ Disclaimer

*Simplified map for computer science education and algorithmic demonstration. Distances and times are mathematical approximations and do not include real-world traffic, train delays, or layovers.*
