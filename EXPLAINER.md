# Understanding Transit Routing and Graph Algorithms

A student guide to pathfinding algorithms using Chennai's metro and MRTS network.

Built by Wrench Wise.

---

## 1. The Problem

Every navigation app must answer a basic question. What is the fastest way to get from point A to point B?

When humans look at a map, our eyes jump to the destination. We naturally trace roads that point in the right direction.

Computers cannot see a visual picture. A computer only sees numbers, connections, and costs. To find a route, it must follow formal rules step by step.

---

## 2. How a City Becomes a Graph

In computer science, a network is called a graph. A graph has two building blocks:

- **Vertices (Nodes):** The points in the network. In Namma Route, each station is a vertex.
- **Edges:** The connections between vertices. In this app, transit tracks and connector links are edges.

Edges carry weights representing travel cost. Here, weights represent travel duration in minutes:

- Consecutive stations on Blue or Green Line take 2 minutes.
- Consecutive stations on MRTS take 3 minutes.
- Walking and bus connectors take between 7 and 20 minutes.

---

## 3. Why Line Changes Are Modelled as Separate Nodes

In real transit, changing trains is not instant. You must walk between platforms, wait for the next train, and board.

If a station had only one node, entering on the Green Line and leaving on the Blue Line would take zero extra time. That would produce unrealistic routes.

To solve this, interchange stations like Chennai Central and Alandur are split into separate line nodes:

- `Alandur (Blue)`
- `Alandur (Green)`

These two nodes are joined by a transfer edge with a 5-minute penalty. When an algorithm chooses to change lines, it must pay that 5-minute cost. This simple modelling decision ensures realistic routes.

---

## 4. A Dijkstra Walk-Through

Consider a trip from Koyambedu to Chennai Airport.

1. **Start:** The search starts at `Koyambedu (Green)` at time 0.
2. **First step:** Koyambedu explores its neighbours, CMBT and Thirumangalam, adding them to a priority queue with cost 2 minutes.
3. **Radial expansion:** Dijkstra always visits the lowest-cost unvisited station next. Because CMBT and Thirumangalam are tied at 2 minutes, it visits CMBT, then Thirumangalam.
4. **Spreading outward:** The search continues along the Green Line toward Alandur. It also spreads backward toward Shenoy Nagar and Egmore because Dijkstra does not know where Chennai Airport is.
5. **Reaching Alandur:** At minute 16, the search reaches `Alandur (Green)`. From there, it explores the 5-minute transfer edge to `Alandur (Blue)` with total cost 21 minutes.
6. **Destination reached:** From `Alandur (Blue)`, the search moves south to Nanganallur Road, Meenambakkam, and reaches `Chennai Airport` at minute 23.
7. **Path reconstruction:** By following parent pointers backward from Chennai Airport, the app builds the final directions: Board Green Line at Koyambedu, change at Alandur to Blue Line, and get off at Chennai Airport.

---

## 5. A* and Why Its Estimate Must Never Overestimate

Dijkstra explores in every direction because it has no sense of where the destination is.

A* adds a compass called a heuristic function, written as h(n). At each step, A* evaluates stations using:

f(n) = g(n) + h(n)

- **g(n):** The exact time spent travelling from the start to station n.
- **h(n):** An estimate of remaining time from station n to the destination.

In Namma Route, h(n) is the straight-line map distance multiplied by a constant k (0.02 min per distance unit).

A key mathematical rule applies here. The heuristic must be **admissible**. This means h(n) must never overestimate the true remaining travel time.

Because our constant k is the fastest possible speed across the entire network, straight-line distance multiplied by k is always less than or equal to the true travel time.

When the estimate is optimistic, A* is mathematically guaranteed to find the true fastest route. It simply explores stations pointing toward the destination first, checking far fewer stations along the way.

---

## 6. BFS and When Fewest Stops Differs from Fastest

Breadth-First Search (BFS) explores a graph level by level. It checks all stations 1 stop away, then all stations 2 stops away, and so on.

BFS ignores edge weights entirely. It only counts the number of station hops.

In transit, "fewest stops" does not always mean "fastest":

- An MRTS route with 5 stops takes 15 minutes (3 minutes per stop).
- A Metro route with 6 stops takes only 12 minutes (2 minutes per stop).

BFS runs on the station-level graph where interchange nodes are merged. Use BFS when you want to minimize the number of times doors open, and Dijkstra when you want to minimize travel minutes.

---

## 7. The Min-Heap

During search, the computer must repeatedly find the unvisited station with the lowest score.

If we kept an unsorted list of 59 stations, finding the smallest would require scanning every station. That takes O(N) operations every single step.

A binary min-heap stores elements in an array structured as a tree. The parent at index i has children at indices 2i+1 and 2i+2. Every parent has a score less than or equal to its children.

- The minimum element is always at the top at index 0. We can read it in O(1) constant time.
- Adding an element (push) takes O(log N) time by bubbling up.
- Removing the minimum (pop) takes O(log N) time by sinking down.

This hand-written min-heap makes the algorithm fast and smooth even on older phones.

---

## 8. Big-O Complexity Comparison

| Algorithm | Graph Representation | Time Complexity | Space Complexity | Guarantees |
|---|---|---|---|---|
| BFS | Station graph (59 nodes) | O(V + E) | O(V) | Minimizes stop count |
| Dijkstra | Line-node graph (61 nodes) | O((V + E) log V) | O(V) | Minimizes total minutes |
| A* Search | Line-node graph (61 nodes) | O((V + E) log V) | O(V) | Minimizes total minutes with fewer visited nodes |

In our network, V is 61 line nodes and E is 132 directed edges.

---

## 9. Five "Try This in the App" Activities

### Activity 1: The Cross-City Comparison

- **Trip:** Pick Nandanam as From and Tiruvottriyur Theradi as To.
- **Action:** Click "Compare Dijkstra vs A*".
- **What to notice:** Dijkstra searches in a wide circle, checking 56 of 59 stations. A* aims north toward the destination and checks only 24 stations. Both find the exact same 30-minute route. A* does 57% less work.

### Activity 2: When Stops Beat Minutes

- **Trip:** Pick Chennai Central as From and Velachery as To.
- **Action:** Switch between "Fastest (Dijkstra)" and "Fewest Stops (BFS)".
- **What to notice:** Compare the routes. Notice how BFS picks a path based on station count, while Dijkstra accounts for bus links and line speed differences.

### Activity 3: Watching the Priority Queue

- **Trip:** Pick Wimco Nagar Depot as From and Chennai Airport as To.
- **Action:** In the Under the Hood panel, set speed to Slow. Click Find Route, then Pause after 5 steps.
- **What to notice:** Look at the Priority Queue list. Notice how stations are sorted in ascending order of time so far. Click Step to see the top station pop off the queue.

### Activity 4: Interchange Transfer Cost

- **Trip:** Pick Vadapalani as From and Guindy as To.
- **Action:** Click Find Route.
- **What to notice:** Notice that the path passes through Alandur. Watch the directions show a line change from Green Line to Blue Line. The 5-minute transfer cost is paid at Alandur.

### Activity 5: Connector Links in Action

- **Trip:** Pick Government Estate as From and Chepauk as To.
- **Action:** Click Find Route.
- **What to notice:** Notice the thin dashed line between the two stations. The algorithm chooses the 15-minute walking connector rather than riding all the way around the network through Central.

---

## Disclaimer

Simplified map for learning. Not official. Times are approximate and may not match real services.
