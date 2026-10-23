# Namma Route

Namma Route is an interactive schematic map and pathfinding visualizer for Chennai's metro and MRTS transit network.

It shows how pathfinding algorithms explore a city network in real time. The search expands across stations like a wave, and the optimal route lights up once found.

A live compare mode runs Dijkstra and A* side by side on the same journey to demonstrate how heuristic search cuts down exploration work while finding the exact same fastest route.

Built by Wrench Wise.

Live demo: https://namma-route.vercel.app (or your deployed Vercel URL)

---

## What the App Does

- **Interactive Transit Map:** Displays an SVG schematic map of Chennai's Blue Line, Green Line, and MRTS network with station dots and interchange rings.
- **Trip Planner:** Pick start and destination stations using type-to-filter search inputs or by tapping directly on map stations.
- **Search Animations:** Watch the search ripple outward from the origin with live step-by-step narration, visited station counters, and priority queue views.
- **Compare Mode:** Runs Dijkstra and A* sequentially on the same trip and displays animated side-by-side metrics showing the work reduction achieved by A*.
- **Three Search Modes:** Supports Fastest Route with Dijkstra, Directional Search with A*, and Fewest Stops with Breadth-First Search (BFS).
- **Under the Hood Panel:** Step through searches manually, pause, adjust speed, and inspect priority queue state.
- **Demo Mode:** Auto-playing loop with simulated taps designed for video capture and social media reels.
- **Offline PWA:** Installable web app with service worker caching for offline use.

---

## Technologies Used

- **HTML5:** Semantic markup and SVG map graphics.
- **CSS3:** Custom properties, CSS Grid, Flexbox, keyframe animations, and dark theme design.
- **JavaScript (ES Modules):** Plain vanilla JavaScript with zero external frameworks, libraries, or npm dependencies.
- **Data Structures:** Custom hand-written binary Min-Heap.
- **Algorithms:** Generator-based implementations of Dijkstra, A* with admissible Euclidean heuristic, and Breadth-First Search (BFS).

---

## How to Run Locally

You only need a modern web browser and a simple static file server.

### Option 1: Python

1. Open your terminal or command prompt.
2. Navigate to the project directory:
   ```bash
   cd C:\Projects\Wrench-Wise\Namma_Route
   ```
3. Start the local server:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

### Option 2: Node.js (npx serve)

1. Open your terminal in the project folder.
2. Run:
   ```bash
   npx serve .
   ```
3. Open the local address shown in the terminal.

---

## Special URL Parameters

- `?demo=1`: Launches automated demo showcase mode with simulated station taps and looping comparisons.
- `?test=1`: Runs the full 3,422 pair verification test in the browser console.
- `?from=STATION_ID&to=STATION_ID`: Automatically loads and calculates a specific route (for example, `?from=koyambedu&to=chennai-airport`).

---

## Disclaimer

Simplified map for learning. Not official. Times are approximate and may not match real services.
