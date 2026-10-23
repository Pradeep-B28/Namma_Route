# Understanding Transit Routing and Graph Algorithms

A student guide to pathfinding algorithms across Tamil Nadu's transit network.

Built by Wrench Wise.

---

## 1. The Problem

Every navigation app must answer a basic question: What is the fastest route from point A to point B?

When humans look at a map of Tamil Nadu, our eyes jump to the destination. If we are travelling from Kanyakumari to Chennai, we naturally look north along the eastern coastline and central highways.

Computers cannot look at a picture. A computer only sees numbers, connections, and costs. To find a route across 55 cities, it must follow formal mathematical rules step by step.

---

## 2. How Tamil Nadu Becomes a Graph

In computer science, a network of connections is called a graph. A graph has two fundamental building blocks:

- **Vertices (Nodes):** The points in the network. In Namma Route, each city represents one or more vertices.
- **Edges:** The connections between vertices. In this app, highways, state roads, ghat roads, and railway tracks are edges.

Edges carry weights representing travel cost. In Namma Route, weights represent travel duration in minutes:

- Highways allow faster speeds (80 km/h average).
- State roads run at moderate speeds (60 km/h average).
- Winding ghat roads run slowly through hills (30 km/h average).
- Mainline trains cruise along major corridors (75 km/h average).
- The Nilgiri Mountain Railway climbs slowly up to Ooty (16 km/h average).

---

## 3. Road, Train, or Both: Multi-Modal Graph Design

In real travel, switching between a bus and a train is not instantaneous. You must disembark, walk between terminals, purchase tickets, and wait for departure.

If a city had only one combined node, switching from a train to a bus would take zero extra minutes. That would produce unrealistic routes that hop between road and rail at every single town.

To model this accurately, every city in Namma Route has a dedicated road node: `<id>:road`. Every city with a railway station also has a dedicated rail node: `<id>:rail`.

In Any mode, these two nodes are connected by an internal transfer edge with a 30-minute penalty. When an algorithm chooses to change travel modes, it must pay that 30-minute cost.

Consider travelling from Chennai to Ooty in Any mode:
- The fastest route takes a train from Chennai south-west to Mettupalayam at the foot of the hills.
- At Mettupalayam, the train route to Ooty on the Nilgiri Mountain Railway takes over 4 hours.
- Instead, the algorithm chooses to pay the 30-minute transfer penalty to switch from train to road at Mettupalayam, and takes the road up the ghat through Coonoor in about 2 hours.
- Total travel time: 707 minutes (about 11 h 47 min).

---

## 4. A Walk-Through of Dijkstra Across Tamil Nadu

Consider travelling from Kanyakumari at the southern tip to Chennai in the north.

1. **Start:** The search begins at Kanyakumari at minute 0, adding both its road and rail nodes to a priority queue.
2. **Radial expansion:** Dijkstra always picks the unvisited node with the lowest travel time so far. It has no idea where Chennai is located.
3. **Exploring all directions:** The search spreads north along the highway to Tirunelveli and west toward the Kerala border. As time progresses, it explores outward in concentric contours.
4. **Blind search:** By the time Dijkstra finally reaches Chennai at minute 738, it has evaluated 49 of the 55 cities in Tamil Nadu. It explored westward to Coimbatore and the Nilgiris, eastward to Thanjavur and Nagapattinam, and north-west toward Salem.
5. **Path reconstruction:** By tracing backward from Chennai through Viluppuram, Tiruchirappalli, Dindigul, Madurai, and Tirunelveli, it constructs the fastest route.

Dijkstra is guaranteed to find the true fastest path, but it does unnecessary work exploring in directions that lead away from the goal.

---

## 5. A* and Its Admissible Straight-Line Estimate

A* improves on Dijkstra by giving the computer a compass. At every step, A* evaluates nodes using the formula:

f(n) = g(n) + h(n)

- **g(n):** The exact travel time spent reaching node n from the start.
- **h(n):** A heuristic estimate of remaining travel time from node n to the destination.

In Namma Route, h(n) is calculated using the haversine formula on real latitude and longitude coordinates to find the straight-line distance in kilometers, multiplied by a safe constant k (1.006192 min/km).

The constant k is the smallest ratio of travel time to straight-line distance across all 146 road and rail links in the entire state. Because no vehicle can travel faster than this ratio, straight-line kilometers multiplied by k will never overestimate the true remaining travel time.

A heuristic that never overestimates is called **admissible**. Because our heuristic is admissible, A* is mathematically guaranteed to find the true fastest route.

When running the same Kanyakumari to Chennai journey:
- A* prioritizes nodes that point northward toward Chennai.
- It refuses to waste time exploring westward toward the Western Ghats.
- A* finds the exact same 738-minute fastest route while checking only 16 cities instead of 49.
- That represents 67% less computational work.

---

## 6. BFS and When Fewest Stops Differs from Fastest

Breadth-First Search (BFS) explores a graph level by level. It checks all cities 1 stop away, then 2 stops away, and so on.

BFS ignores travel time and road speeds entirely. It only counts the number of city stops.

In transit, fewest stops does not mean fastest:
- Driving from Coimbatore to Ooty via the ghat road takes 2 stops and about 3 hours.
- Taking the heritage mountain train via Mettupalayam and Coonoor takes 3 stops but over 5 hours.
- BFS picks the path with the fewest transfers, while Dijkstra and A* pick the path that gets you there earliest.

---

## 7. The Binary Min-Heap Priority Queue

During pathfinding, the computer must repeatedly extract the candidate node with the lowest score.

If we stored candidates in an unsorted array, finding the minimum node would require scanning every item, taking O(N) linear time at every single step.

A binary min-heap arranges elements in an array structured as a complete binary tree. The parent at index i has children at indices 2i+1 and 2i+2:
- The smallest element is always at the root (index 0), readable in O(1) constant time.
- Adding a candidate (push) takes O(log N) time by bubbling up.
- Removing the smallest candidate (pop) takes O(log N) time by sinking down.
- Ties in priority are broken alphabetically by node name. This ensures results are completely deterministic and repeatable across devices.

---

## 8. Five "Try This in the App" Activities

### Activity 1: The State-Wide Comparison
- **Trip:** Pick Kanyakumari as From and Chennai as To in Any mode.
- **Action:** Click "Compare Dijkstra vs A*".
- **What to notice:** Watch Dijkstra expand radially across 49 cities. Then watch A* aim straight up the transit corridor, checking only 16 cities. Both find the exact same 738-minute route. A* completes the task with 67% less work.

### Activity 2: Road vs Train on the Mountain
- **Trip:** Pick Coimbatore as From and Ooty as To.
- **Action:** Find the route in Road mode, then switch to Train mode and find the route again.
- **What to notice:** Road mode takes the mountain highway in about 3 hours. Train mode routes through Mettupalayam and boards the Nilgiri Mountain Railway, taking over 5 hours.

### Activity 3: The 30-Minute Transit Transfer
- **Trip:** Pick Chennai as From and Ooty as To in Any mode.
- **Action:** Click Find Route and read the directions step list.
- **What to notice:** Notice how the algorithm takes an express train to Mettupalayam, pays a 30-minute transfer penalty to switch to road, and drives the remaining 51 km up the mountain. Total time: 707 minutes.

### Activity 4: Non-Rail Cities in Train Mode
- **Trip:** Switch travel mode to Train. Tap Kodaikanal on the map.
- **Action:** Observe the map and toast feedback.
- **What to notice:** Kodaikanal is dimmed to 40% opacity. Tapping it triggers a small horizontal shake animation and displays a toast message explaining there is no railway station in Kodaikanal.

### Activity 5: Watching the Priority Queue
- **Trip:** Pick Hosur as From and Rameswaram as To.
- **Action:** Set animation speed to Slow in the Under the Hood panel. Click Find Route, then click Pause after a few steps.
- **What to notice:** Inspect the Priority Queue list. Notice how nodes are ordered by total estimated cost. Click Step to watch the computer pop the lowest-cost candidate off the top of the heap.

---

## Disclaimer

Simplified map for learning. Not official. Distances and times are approximate and do not include waiting for trains or buses.
