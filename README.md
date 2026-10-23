# Namma Route

Interactive transit pathfinding visualizer for Chennai's metro and MRTS network.

Built by Wrench Wise.

Live Deployment: https://nammaroute-sigma.vercel.app/  
Automated Demo Reel: https://nammaroute-sigma.vercel.app/?demo=1  
Self-Test Verification: https://nammaroute-sigma.vercel.app/?test=1  

---

## Overview

When you request directions on a navigation app, you see a route appear instantly. Under the hood, computers run graph algorithms that scan millions of potential paths.

Namma Route opens the black box. It models Chennai's rail transit network and animates how pathfinding algorithms explore the city station by station.

The headline feature is Compare Mode. It runs Dijkstra and A* sequentially on the exact same origin and destination:
- Dijkstra expands radially in all directions without knowing where the destination lies.
- A* uses a straight-line coordinate heuristic like a compass to steer search toward the destination.
- On a cross-city journey from Nandanam to Tiruvottriyur Theradi, Dijkstra evaluates 56 stations. A* evaluates only 24 stations. Both find the exact same 30-minute route. A* completes the job with 57% less work.

---

## Live Features

- **Interactive Schematic Map:** Hand-crafted SVG map (1000 by 1400 canvas) displaying the Blue Line, Green Line, and MRTS with custom interchange rings and dashed connector links.
- **Dual Station Selection:** Select stations by tapping directly on the schematic map or by typing into filterable dropdown lists.
- **Search Animations:** Watch the exploration wave expand outward from the origin with pulsing station glows and candidate indicators for queued stations.
- **Glowing Route Trace:** Smooth glowing polyline that progressively animates along the tracks from departure to destination upon search completion.
- **Three Pathfinding Modes:**
  - Fastest Route (Dijkstra)
  - Directional Search (A*)
  - Fewest Stops (Breadth-First Search)
- **Under the Hood Panel:** Live inspected station counter, real-time narration of each algorithm step, and an interactive view of the top 5 priority queue entries.
- **Playback Controls:** Play, pause, single-step execution, and three animation speed presets (Slow, Normal, Fast).
- **Interactive Explanations:** Built-in drawer explaining graphs, Dijkstra, A*, BFS, min-heaps, and Big-O computational complexity.
- **Demo Mode for Reels:** Auto-looping showcase with simulated station taps designed for social media recording.
- **PWA and Offline Support:** Installable web application powered by a cache-first service worker.
- **Deep Linking:** Share routes directly using URL query parameters.

---

## Network Model and Graph Architecture

The network models real-world transit considerations using a weighted, directed graph:

- **Stations:** 59 unique stations across Chennai.
- **Line Nodes:** 61 line nodes. Interchanges (Chennai Central and Alandur) are split into separate nodes per line (e.g. `Alandur (Blue)` and `Alandur (Green)`).
- **Transfer Penalty:** Line nodes at the same interchange are joined by a 5-minute transfer edge. This ensures algorithms realistically account for the cost of changing trains.
- **Travel Durations:**
  - Blue Line consecutive stations: 2 minutes
  - Green Line consecutive stations: 2 minutes
  - MRTS consecutive stations: 3 minutes
  - Interchange transfer: 5 minutes
  - Connector walking and bus links: 7 to 20 minutes
- **Station-Level Graph:** BFS runs on a merged 59-node station graph to calculate minimal stop hops.

---

## Algorithm Specifications

### 1. Dijkstra Algorithm
- Explores outward in concentric time contours.
- Guarantees the optimal fastest path on graphs with non-negative edge weights.
- Time Complexity: O((V + E) log V) using a binary min-heap.

### 2. A* Search Algorithm
- Uses an evaluation function f(n) = g(n) + h(n), where g(n) is elapsed travel time and h(n) is the heuristic estimate.
- Heuristic: Straight-line distance multiplied by constant k = 0.02 min per distance unit.
- The scaling constant k represents the fastest possible speed across the network. Because h(n) never overestimates the true remaining travel time, the heuristic is mathematically admissible and consistent. A* is guaranteed to find the true fastest path while pruning irrelevant search space.

### 3. Breadth-First Search (BFS)
- Traverses network levels systematically without considering travel time.
- Identifies paths with the fewest physical station transfers.

### 4. Hand-Written Binary Min-Heap
- Implemented from scratch in pure JavaScript with zero dependencies.
- Maintains priority queue ordering with O(log N) push and pop operations.
- Powers efficient extraction of the lowest-cost candidate station at every step.

---

## Correctness and Benchmark Results

The app includes an automated verification test suite that evaluates all 3,422 unique station pairs:

| Metric | Result |
|---|---|
| Total Station Pairs Tested | 3,422 pairs (59 x 58) |
| Pathfinding Failures | 0 |
| Network Reachability | 100% |
| Dijkstra vs A* Time Equivalence | 100% agreement (3,422 / 3,422 pairs) |
| Average Stations Checked (Dijkstra) | 30.5 stations |
| Average Stations Checked (A*) | 21.7 stations |
| Top Work Reduction Trip | Nandanam to Tiruvottriyur Theradi (57% reduction) |

Run the benchmark in your browser by opening `https://nammaroute-sigma.vercel.app/?test=1` or running `node test-runner.js` in terminal.

---

## Project Structure

```
Namma_Route/
├── index.html          Semantic markup and application layout
├── styles.css          Dark theme styling and animation keyframes
├── manifest.json       Progressive Web App manifest
├── sw.js               Cache-first service worker
├── test-runner.js      Node.js automated benchmark suite
├── README.md           Project overview and technical documentation
├── EXPLAINER.md        Student guide to graph algorithms and heuristics
├── REEL_SCRIPT.md      Production video recording scripts (9:16 and 16:9)
├── assets/
│   ├── favicon.png     App icon
│   └── logo.png        Wrench Wise branding logo
└── js/
    ├── data.js         Station coordinates, line routes, and connectors
    ├── graph.js        Graph builder and heuristic constant calculator
    ├── heap.js         Hand-written binary min-heap priority queue
    ├── algorithms.js   Generator implementations of Dijkstra, A*, and BFS
    ├── route.js        Path reconstruction and plain-language directions
    ├── render.js       SVG map renderer, zoom/pan, and animation layer
    ├── animate.js      Step-by-step playback and Compare mode orchestrator
    ├── ui.js           Dropdown comboboxes, Under the Hood panel, and controls
    ├── demo.js         Simulated tap loop controller for recording reels
    ├── test.js         Self-test suite for all 3,422 station pairs
    └── main.js         Application bootstrap and parameter routing
```

---

## Local Setup and Development

This project uses plain HTML5, CSS3, and JavaScript (ES Modules). It requires no build tools, compilers, CDNs, or npm installations.

### Method 1: Python Static Server

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

### Method 2: Node Static Server

```bash
cd C:\Projects\Wrench-Wise\Namma_Route
npx serve .
```
Open the local URL displayed in the terminal.

---

## URL Parameters

- `?demo=1` Launch automated showcase mode with simulated taps and comparison loops.
- `?test=1` Run the full 3,422 pair verification test and log detailed statistics.
- `?from=STATION_ID&to=STATION_ID` Pre-load and compute a trip between any two stations.

---

## Disclaimer

Simplified map for learning. Not official. Times are approximate and may not match real services.
