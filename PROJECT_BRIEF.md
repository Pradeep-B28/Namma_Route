# Namma Route: Project Brief

You are building a small web app in this folder. Read this whole file before writing any code. Follow the phases in Section 9 in order, and stop at the end of each phase.

---

## 1. What we are building

Namma Route is a simplified map of Chennai's metro and MRTS network. A user picks a start station and an end station, and the app finds the fastest route.

The magic is that it shows HOW the computer searches. The search spreads across the city like a ripple, then the best route lights up.

The headline moment is Compare mode. It runs two algorithms on the same trip:
- Dijkstra searches in every direction.
- A* uses a sense of direction and checks far fewer stations.

A counter then shows the difference, for example: "Dijkstra checked 41 stations. A* checked 17. Same route, 59% less work."

Who it is for:
- **Social media viewers with no tech background.** It must look beautiful and make sense within 5 seconds.
- **Students learning DSA.** It must show what the algorithm is doing, step by step.
- **Parents and prospects.** It must look professional and carry Wrench Wise branding.

When there is a trade-off, student learning comes first and visual wow comes second.

---

## 2. Hard rules

1. **Code.** Use plain HTML, CSS and JavaScript only. No frameworks, libraries, CDNs or npm packages inside the app. Write the min-heap and all algorithms by hand, with clear comments, because students will read this code.
2. **Front-end only.** No backend, database, API keys, AI calls or external map tiles.
3. **Data.** Use only the station and link data in Section 6. Do not add, rename or remove stations.
4. **Writing style.** All UI text and docs are in plain English with short sentences. No emojis. No em dashes (the long dash).
5. **Official status.** Never present the data as official or live. Always show the disclaimer from Section 8. Do not use the CMRL logo or any official logo.
6. **File size.** Keep each file focused, under about 400 lines.
7. **Phases.** At the end of every phase, stop and give a Phase Report (Section 10). Do not start the next phase until I say so.
8. **Stubborn bugs.** If the same bug survives two fix attempts, stop. Explain the problem in plain words and give me options. Do not keep looping.
9. **My actions.** I am not from a tech background. When you need me to do something (click, log in, approve), give numbered click-by-click steps.
10. **Commands.** Before running a terminal command, tell me in one line what it does.

---

## 3. Tech setup

- Run locally with a simple static server: `npx serve .`
  - If that fails, use `python -m http.server 8000`.
  - Test in the browser at the address it prints.
- Use ES modules (`<script type="module">`).
- Folder structure:

```
namma-route/
  index.html
  styles.css
  manifest.json
  sw.js
  assets/          logo.png (if provided), app icons
  js/
    data.js        stations, lines, links (from Section 6)
    graph.js       builds the graph from data
    heap.js        hand-written min-heap
    algorithms.js  dijkstra, astar, bfs as step-by-step generators
    render.js      draws the SVG map
    animate.js     plays algorithm steps on the map
    ui.js          controls, panels, demo mode
    main.js        wires everything together
  README.md
  EXPLAINER.md
  REEL_SCRIPT.md
```

- **Algorithm structure.** Write each algorithm as a JavaScript generator function (`function*`).
  - It yields one event per step, for example: "visit station", "add to queue", "finished with path".
  - The animation layer plays these events at any speed and supports pause and single-step.
  - The algorithm code stays clean and readable this way.

---

## 4. Features

### Must have

**A. Map**
- **Drawing.** An SVG schematic map using the positions in Section 6 (viewBox `0 0 1000 1400`).
  - Lines are smooth, thick strokes in their line colours.
  - Stations are dots. Interchange stations are larger rings.
  - Connector links (bus or walk) are thin dashed lines.
- **Labels.** Always show labels for interchanges, end-of-line stations, and the selected start and end. Show other labels on hover or tap. Avoid label clutter on phone.
- **Tapping.** Tapping the map selects the nearest station within 24px.

**B. Pick a trip**
- **Inputs.** Two inputs, From and To, each with a type-to-filter dropdown of station names. This is the main way to pick on phone.
- **Map tapping.** The first tap sets From. The second tap sets To.
- **Swap.** A Swap button exchanges From and To.

**C. Find route**
- **Modes:**
  - Fastest (Dijkstra)
  - Fastest with a sense of direction (A*)
  - Fewest stops (BFS)
- **Search animation.** Press "Find route" and the chosen algorithm runs as an animation.
  - Each checked station pulses, and a soft glow ripples outward from it.
  - Stations waiting in the queue show a faint ring.
- **Route animation.** When the search is done, the final route draws itself along the lines with a bright glowing stroke, from start to end.
- **Result card:**
  - Total minutes, shown as "about X min"
  - Number of stops
  - Number of line changes
  - Step list in plain words, for example: "Board Green Line at Koyambedu towards Alandur. Change at Alandur to Blue Line. Get off at Chennai Airport."

**D. Compare (the hero feature)**
- One button: "Compare Dijkstra vs A*".
- **Sequence:**
  1. Run Dijkstra. Explored stations glow in the Dijkstra colour.
  2. Clear the map.
  3. Run A*. Explored stations glow in the A* colour.
  4. Show both counts side by side with a count-up number animation: "Dijkstra checked X stations. A* checked Y. Same route, Z% less work."
- Both must give the same total time. If they do not, that is a bug (see Section 7).

**E. Under the hood panel (teaching layer)**
- **Counter.** A live count of stations checked.
- **Queue view.** The top 5 entries of the priority queue, sorted and updating every step. Each entry shows the station and its time so far. For A*, also show the estimate.
- **Narration.** One line of plain English describing the current step, for example: "Checking Guindy. We can reach it in 18 min. Adding its neighbours to the queue."
- **Controls.** Play/Pause, Step (one step at a time), and a Speed slider (slow, normal, fast).
- **"How it works" drawer.** Short explanations, 5 to 8 lines each in plain language, covering:
  - What a graph is
  - Dijkstra
  - A* and its estimate
  - BFS
  - Min-heap
  - Big-O for each algorithm

**F. Demo mode (for recording reels)**
- **Opening.** Opens with `?demo=1` in the URL, or from a small Demo button.
- **Sequence.** It hides the input controls, then auto-plays and loops:
  1. Pick From, with a visible tap animation.
  2. Pick To, with a visible tap animation.
  3. Run Compare.
  4. Show the result card and hold for 3 seconds.
  5. Loop.
- **Demo trip.** Choose the cross-city trip with the biggest gap between Dijkstra and A* station counts. Compute it, do not guess. Tell me which trip you chose in the Phase Report.
- **Layouts.** It must look clean in both vertical (9:16 phone) and horizontal (16:9 laptop).

**G. Layout**
- **Phone portrait.** Header at the top. The map fills the top 60 to 65%. Below it, a bottom sheet holds the controls and results and can expand.
- **Laptop landscape.** Map on the left (about 65%), panel on the right.
- **General:**
  - Touch targets at least 44px.
  - No horizontal scrolling.
  - Smooth animations using requestAnimationFrame.

**H. Branding**
- **Header.** "Namma Route" with "by Wrench Wise". Use `assets/logo.png` if it exists. Otherwise use a clean text wordmark.
- **Footer.** The disclaimer from Section 8.
- **Colours.** From Section 5.

### Nice to have (only if time allows, in this order)
1. **Zoom and pan.** Scroll or pinch to zoom, drag to pan, plus a Reset View button.
2. **Installable app.** Can be added to the phone home screen (manifest.json plus a simple service worker for offline use).
3. **Share link.** A "Share this route" button that copies a link with From and To in the URL.

---

## 5. Visual style

- **Look.** Dark theme, so the glows pop. Clean, modern, premium, with generous spacing.
- **Font.** System font stack only. No web fonts.
- **Colours.** Put all colours as CSS variables in `:root`, in one place.

**Brand colours.** Replace these two if you have official Wrench Wise hex codes.
- `--brand-primary: #FFB020;`
- `--brand-secondary: #7C5CFF;`

**Base**
- Background `#0B0F17`
- Surface (panels, cards) `#141A26`
- Text `#E8ECF3`
- Muted text `#8A94A7`

**Lines**
- Blue Line `#2F80ED`
- Green Line `#27AE60`
- MRTS `#D16BA5`
- Connector links `#5B6577` (dashed)

**Algorithm visuals**
- Dijkstra explored glow `#56CCF2`
- A* explored glow: brand primary
- Final route: white core with a brand primary outer glow
- Buttons: brand primary. Hover and accents: brand secondary.

---

## 6. Network data

### How to model it
- **Travel times:**
  - Next station on Blue or Green Line: 2 min
  - Next station on MRTS: 3 min
  - Changing lines at an interchange: 5 min
  - Connector links: the time listed
- **Line nodes.** Model each station-on-a-line as its own node, for example "Alandur (Blue)" and "Alandur (Green)". Join them with a 5 min transfer edge. This is how the algorithm pays for changing lines.
- **Connector links** join to every line node of that station.
- **On the map**, draw each station once.
- **Counting.** "Stations checked" counts unique stations, not line nodes.
- **BFS** runs on the station-level graph (line nodes merged) and ignores time.
- **Positions** are schematic (x, y on the 1000 by 1400 canvas), not geographic.
- **Expected counts:** 59 unique stations and 61 line nodes. Interchanges are Chennai Central and Alandur.

### Blue Line (north to south)

| Station | x | y |
|---|---|---|
| Wimco Nagar Depot | 780 | 60 |
| Wimco Nagar | 775 | 100 |
| Tiruvottriyur | 770 | 140 |
| Tiruvottriyur Theradi | 765 | 180 |
| Kaladipet | 760 | 220 |
| Tollgate | 755 | 260 |
| New Washermenpet | 750 | 300 |
| Tondiarpet | 745 | 340 |
| Sir Theagaraya College | 740 | 380 |
| Washermenpet | 730 | 420 |
| Mannadi | 715 | 460 |
| High Court | 690 | 500 |
| Chennai Central | 640 | 540 |
| Government Estate | 620 | 600 |
| LIC | 600 | 650 |
| Thousand Lights | 585 | 700 |
| AG-DMS | 570 | 750 |
| Teynampet | 555 | 800 |
| Nandanam | 540 | 850 |
| Saidapet | 515 | 900 |
| Little Mount | 490 | 945 |
| Guindy | 455 | 985 |
| Alandur | 400 | 1030 |
| Nanganallur Road | 370 | 1110 |
| Meenambakkam | 335 | 1190 |
| Chennai Airport | 300 | 1270 |

### Green Line (Chennai Central to St. Thomas Mount)

| Station | x | y |
|---|---|---|
| Chennai Central | 640 | 540 |
| Egmore | 585 | 530 |
| Nehru Park | 535 | 525 |
| Kilpauk Medical College | 485 | 525 |
| Pachaiyappa's College | 435 | 525 |
| Shenoy Nagar | 385 | 530 |
| Anna Nagar East | 340 | 540 |
| Anna Nagar Tower | 300 | 560 |
| Thirumangalam | 265 | 590 |
| Koyambedu | 245 | 640 |
| CMBT | 240 | 695 |
| Arumbakkam | 250 | 750 |
| Vadapalani | 275 | 805 |
| Ashok Nagar | 300 | 860 |
| Ekkattuthangal | 340 | 950 |
| Alandur | 400 | 1030 |
| St. Thomas Mount | 330 | 1070 |

### MRTS (Chennai Beach to Velachery)

| Station | x | y |
|---|---|---|
| Chennai Beach | 790 | 500 |
| Chennai Fort | 760 | 555 |
| Park Town | 700 | 585 |
| Chintadripet | 700 | 640 |
| Chepauk | 720 | 695 |
| Thiruvallikeni | 745 | 745 |
| Light House | 770 | 795 |
| Mundagakanni Amman Koil | 770 | 845 |
| Thirumayilai | 760 | 895 |
| Mandaveli | 745 | 945 |
| Greenways Road | 725 | 990 |
| Kotturpuram | 700 | 1035 |
| Kasturba Nagar | 705 | 1085 |
| Indira Nagar | 715 | 1135 |
| Thiruvanmiyur | 725 | 1185 |
| Taramani | 690 | 1225 |
| Perungudi | 645 | 1250 |
| Velachery | 590 | 1255 |

### Connector links (sample bus and walk links, approximate)

| From | To | Type | Minutes |
|---|---|---|---|
| Chennai Central | Park Town | Walk | 7 |
| Government Estate | Chepauk | Walk | 15 |
| Teynampet | Thirumayilai | Bus | 15 |
| Little Mount | Kotturpuram | Bus | 12 |
| Guindy | Velachery | Bus | 20 |

---

## 7. Correctness checks (must pass)

1. **Reachability.** Every station is reachable from every other station.
2. **A* estimate.** Use straight-line distance between map positions, multiplied by k.
   - k is the smallest value of (minutes divided by distance) across all edges with distance above zero.
   - This guarantees the estimate never overestimates, so A* always finds the true fastest route.
   - Do not use any other estimate.
3. **Self-test.** When the URL has `?test=1`, run a self-test and log the results to the console:
   - For every pair of stations, Dijkstra's total time must equal A*'s total time.
   - Report the number of pairs tested, any failures, and the average stations checked by each algorithm.
4. **Route text.** The route step text matches the drawn route.
5. **Console.** No console errors.
6. **Screen sizes.** Test at phone size (390 x 844) and laptop size (1440 x 900). Take screenshots for the Phase Report if you can.

---

## 8. Disclaimer (show in the footer, always visible)

"Simplified map for learning. Not official. Times are approximate and may not match real services."

---

## 9. Phases

### Phase 1: Data and brain (target 45 min)
- **Build:** `data.js`, `graph.js`, `heap.js`, `algorithms.js` and the self-test.
- **Report:**
  - Station count (59) and line node count (61)
  - Edge count
  - Self-test results
  - The demo trip you chose, with both station counts

### Phase 2: Map and basic route (target 60 min)
- **Build:** Render the map, add station picking (dropdowns and tap), and Find Route for all three modes with a simple highlight.
- **Report:** The result card with step text, plus phone and laptop screenshots.

### Phase 3: The wow (target 60 min)
- **Build:**
  - Ripple and pulse search animation
  - Route draw animation
  - Compare mode with the count-up numbers
  - Under the Hood panel with Play, Pause, Step and Speed
  - "How it works" drawer

### Phase 4: Polish and demo (target 40 min)
- **Build:**
  - Phone and laptop layouts
  - Demo mode
  - Branding and disclaimer
- **Then,** only if time allows, the Nice to Have items in order.

### Phase 5: Docs and deploy (target 30 min)

- **README.md:**
  - What the app is and the live link
  - How to run it locally
  - Tech used and algorithms used
  - "Built by Wrench Wise" and the disclaimer
- **EXPLAINER.md** (for students; plain language, short paragraphs):
  - The problem
  - How a city becomes a graph
  - Why line changes are modelled as separate nodes
  - A Dijkstra walk-through using a real trip from the app
  - A*, and why its estimate must never overestimate
  - BFS, and when "fewest stops" differs from "fastest"
  - The min-heap, and why it makes Dijkstra fast
  - A Big-O table
  - Five "try this in the app" activities, each with what to notice
- **REEL_SCRIPT.md:** Two versions, one vertical (30 seconds) and one horizontal (60 seconds). Each has:
  - A hook as on-screen text in the first 2 seconds
  - A shot list matched to demo mode timing
  - On-screen captions
  - Optional voiceover lines
  - A closing line with Wrench Wise
  - No emojis and no em dashes
- **Deploy:**
  1. Help me push the folder to GitHub. I will give you my empty repository URL.
  2. Deploy it on Vercel as a static site.
  3. Give click-by-click steps for anything I must do myself.
  4. Confirm the live link works on a phone-sized screen.

---

## 10. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop, where relevant)
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 11. If we are running late

If I say "We're behind, apply the cut list", drop these in order:
1. Nice to Have items (zoom and pan, installable app, share link)
2. Fewest Stops (BFS) mode in the app. Keep BFS in EXPLAINER.md.
3. The live queue view in the Under the Hood panel. Keep the counter and narration.

Never cut:
- Ripple animation
- Compare mode
- Demo mode
- Disclaimer
- Deployment
