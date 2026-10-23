# Namma Route: Tamil Nadu Upgrade Brief

You are upgrading a finished, working web app in this folder. Read this whole file before you change anything. Work one phase at a time (Section 12). Stop at the end of each phase and give a Phase Report (Section 14).

Where this file and PROJECT_BRIEF.md disagree, this file wins. Everything in PROJECT_BRIEF.md that this file does not change still applies.

---

## 1. What is changing

| Area | Now | After this upgrade |
|---|---|---|
| Map | Chennai metro and MRTS | All of Tamil Nadu: 38 district headquarters plus 17 key towns (55 cities), linked by road and by train |
| Data | Hand-typed station tables | One ready-made file: `js/tn-data.js` (already in this folder) |
| Travel modes | Metro only | Any (road and train mixed), Road only, Train only |
| Look | Dark amber and violet | Light and dark themes that match the wrench-wise.com website |
| Motion | Search ripple and route draw | Plus a loader, 3D motion, entrance reveals, micro interactions and parallax |

What must keep working: Dijkstra, A*, BFS, Compare mode, the Under the Hood panel (counter, queue view, narration, play, pause, step, speed), the How It Works drawer, Demo mode, the self-test, the disclaimer, phone and laptop layouts, and deployment.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript only. No frameworks, libraries, CDNs, npm packages or web fonts inside the app. Write all animation by hand with CSS, `requestAnimationFrame` and `IntersectionObserver`.
2. **Front-end only.** No backend, database, API keys, AI calls or external map tiles.
3. **Data is locked.** Use `js/tn-data.js` exactly as given. Do not add, rename or remove cities or links, and do not change any number. If a check fails, stop and tell me. Never "fix" the data yourself.
4. **Writing style.** All UI text, docs and code comments are plain English with short sentences. No emojis. No em dashes or en dashes (the long dashes). Use "to" for ranges, for example "4 to 5 hours".
5. **Not official.** Always show the disclaimer from Section 9. Do not use logos or names as branding for TNSTC, SETC, Indian Railways, Southern Railway, CMRL or Google Maps.
6. **Read before you change.** Read the existing code first. Change only what this brief asks for. Do not rewrite a file that does not need to change.
7. **Nothing breaks.** At the end of every phase, every feature listed in Section 1 must still work.
8. **File size.** Keep each file under about 400 lines. Split a file if it grows past that.
9. **Phases.** Stop after each phase with a Phase Report. Do not start the next phase until I say so.
10. **Stubborn bugs.** If the same bug survives two fix attempts, stop. Explain it in plain words and give me options.
11. **My actions.** I am not from a tech background. When you need me to do something, give numbered click-by-click steps.
12. **Commands.** Before running any terminal command, tell me in one line what it does.
13. **Service worker.** The app has a service worker (`sw.js`) that caches old files. While you develop and test, unregister it in the test browser (DevTools, Application, Service Workers, Unregister) or tick "Update on reload". Otherwise you will be testing old files.

---

## 3. The new data: `js/tn-data.js`

The file exports these values:

| Export | What it is |
|---|---|
| `VIEWBOX` | `{ width: 1000, height: 1330 }`. Use it as the SVG viewBox. |
| `TRANSFER_MINUTES` | 30. Time to switch between road and train in the same city. |
| `SPEEDS_KMPH` | Average speeds used to work out the minutes. For display in How It Works only. |
| `STATE_OUTLINE` | Tamil Nadu's outline as an SVG path, already in map coordinates. |
| `CITIES` | 55 cities. Fields below. |
| `ROAD_LINKS` | 86 road links. |
| `RAIL_LINKS` | 60 rail links. |
| `EXPECTED` | Numbers the self-test must reproduce exactly. |

**City fields**
- `id`: unique key, for example `"trichy"`.
- `name`: display name, for example `"Tiruchirappalli"`.
- `lat`, `lng`: real coordinates. Use these for distance.
- `x`, `y`: position on the SVG map. Use these for drawing only.
- `hq`: `true` if it is a district headquarters.
- `district`: the district it is headquarters of, or `null`.
- `rail`: `true` if it has a railway station.
- `station`: station name, for example Vellore's station is `"Katpadi"`. `null` if no station.
- `tier`: 1 = major city, 2 = district headquarters, 3 = town. Controls label visibility.
- `label`: `{ dx, dy, anchor }`. Where to put the name next to the dot. Already placed to avoid overlaps.
- `aliases`: other spellings for search, for example Trichy, Tuticorin, Madras.

**Link fields**
- `a`, `b`: city ids. Links work in both directions.
- `km`: approximate distance.
- `min`: travel time in minutes. Use this as the weight.
- `kind`: road links are `"highway"`, `"state"` or `"ghat"`. Rail links are `"main"`, `"branch"` or `"hill"`.
- `offset`: shift the drawn line sideways by this many map units (Section 5). Drawing only.

Six cities have no railway station: Krishnagiri, Kallakurichi, Perambalur, Mamallapuram, Kodaikanal, Batlagundu.

---

## 4. How the graph works (the brain)

Replace the metro graph with this model. Keep the algorithms as generator functions that yield one event per step, as now.

**Nodes**
- Every city has a road node, named `"<id>:road"`.
- Every city with `rail: true` also has a rail node, named `"<id>:rail"`.

**Edges**
- Each road link joins two road nodes. Weight = `min`.
- Each rail link joins two rail nodes. Weight = `min`.
- A transfer edge joins a city's road node to its rail node. Weight = `TRANSFER_MINUTES`. Transfer edges exist only in Any mode.

**Travel mode** (new tabs: Any, Road, Train. Default: Any)
- **Road:** road nodes and road links only.
- **Train:** rail nodes and rail links only. Cities without a station cannot be picked (Section 7, item 13).
- **Any:** all nodes, all links and the transfer edges.

**Start and finish**
- Start: put every node of the start city that exists in the current mode into the queue at 0 minutes. In Any mode that means both the road node and the rail node.
- Finish: stop the first time any node of the destination city is taken out of the queue.

**Counting**
- "Cities checked" counts unique cities taken out of the queue, not nodes. Rename "stations" to "cities" everywhere in the UI and code.

**A\* estimate**
- Straight-line km between two cities: the haversine formula on `lat` and `lng` with Earth radius 6371 km. Never use `x` and `y` for distance.
- k = the smallest value of (`min` divided by straight-line km between its two cities) across all road and rail links. Work it out in code when the app starts. It must equal `EXPECTED.k` (1.006192) to 4 decimal places.
- Estimate for a node = k times the straight-line km from that node's city to the destination city.
- This estimate never overestimates, so A* always finds the true fastest time. Do not use any other estimate.

**BFS (fewest stops)**
- Runs on cities, not nodes. Two cities are neighbours if a link between them is allowed in the current mode. It ignores time.
- For the result card, each hop uses the faster allowed link between the two cities. In Any mode, add `TRANSFER_MINUTES` each time the trip switches between road and train.

**Repeatable results**
- When you build the graph, sort each neighbour list by node name.
- In the min-heap, break ties by node name (alphabetical). Then the same trip always gives the same route.

**Result card**
- Time: "about 12 h 18 min". Under an hour: "about 45 min".
- Distance: "738 km".
- Number of stops and number of switches between road and train.
- Step list. Join back-to-back hops of the same type into one step. Use the station name when it differs from the city name. Examples:
  - "Take a train from Chennai to Viluppuram. 159 km, about 2 h 39 min."
  - "Switch from train to road at Mettupalayam. About 30 min."
  - "Go by road from Mettupalayam to Ooty via Coonoor. 51 km, about 2 h 3 min."
  - "Board at Vellore (Katpadi station)."

**Under the Hood**
- Queue entries show the city, the type and the time so far, for example "Madurai (train) 6 h 52 min". For A*, also show the estimate.
- Narration example: "Checking Madurai by train. We can reach it in 6 h 52 min. Adding its neighbours to the queue."

---

## 5. The map

**Layers, bottom to top:** state outline, road links, rail links, explored glow, route, city dots, labels, start and end pins.

**State outline:** fill `--land`, stroke `--land-stroke`, 3 units wide.

**Road links:** `--road`. Highway 4 units wide. State 2.5 units. Ghat 2.5 units, dotted (dash `2 6`, round caps).

**Rail links:** the railway map look. A 4-unit line in `--rail`, with a 2-unit line in `--rail-dash` on top, dashed `6 6`. Hill links get a tooltip: "Nilgiri Mountain Railway. Very slow."

**Offsets:** if a link has `offset` not 0, move both ends sideways so road and rail between the same two cities sit side by side.
- dx = x2 - x1, dy = y2 - y1, L = length of (dx, dy).
- nx = -dy / L * offset, ny = dx / L * offset.
- Draw from (x1 + nx, y1 + ny) to (x2 + nx, y2 + ny).

**City dots:** district headquarters are filled `--brand` dots with a `--brand-strong` ring. Towns are hollow rings. Tier 1 radius 9 units, others 6.5.

**Labels**
- Position: (x + dx times f, y + dy times f) with the given `anchor`, where f = label size in map units divided by 18.
- Size on screen: 12px (tier 1: 13px, bold). Convert to map units using the current zoom.
- Halo: a stroke in the background colour behind the text (`paint-order: stroke`) so labels stay readable over lines.
- Phone (under 768px wide): tier 1 always. Tier 2 from 1.6x zoom. Tier 3 from 2.5x zoom.
- Laptop: tier 1 and 2 always. Tier 3 from 1.6x zoom or on hover.
- Always show labels for the selected From and To cities and every city on the drawn route.

**Zoom and pan (now a must have).** The state map is dense, so this is no longer optional.
- Mouse wheel and pinch to zoom, 1x to 4x. Drag to pan. A "Reset view" button.
- Zoom by changing the SVG `viewBox`, not with CSS transforms. If zoom already exists using CSS transforms, switch it to `viewBox`. This keeps tap positions exact.

**Tapping a city**
- Convert the pointer to map coordinates with `svg.getScreenCTM().inverse()` and a `DOMPoint`.
- Pick the nearest city within 22 screen pixels (convert to map units using the current zoom).
- Must work at every zoom level and after panning.

**Hover card (laptop):** city name, district (if any), and "Railway station: Katpadi" or "No railway station".

**Legend:** a small card with Highway, State road, Ghat road, Train line, District headquarters, Town.

**Glow performance:** for explored cities, use a soft circle (radius 14 units, 25% opacity) and a ring. Do not put SVG blur filters on many elements. A blur filter is allowed only on the final route line.

---

## 6. Theme: light and dark, matched to wrench-wise.com

These values were measured from the live wrench-wise.com site. It uses Tailwind colours: emerald as the main brand colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients.

**Font:** the same system font stack the site uses: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800 with letter spacing -0.01em. Body weight 400 to 500.

**Shapes:** buttons and tabs fully rounded (999px). Cards 16px. Inputs 12px. Small chips 8px.

**Shadows (light theme)**
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`
- In dark theme use the same shapes with `rgba(0,0,0,0.40)`.

**Brand gradient:** `linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for the primary button, a 3px accent bar under the header, the loader and the final route line.

**Tokens.** Put every colour in CSS variables in one place. Light values go on `:root, [data-theme="light"]`. Dark values go on `[data-theme="dark"]`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--land` | `#ECFDF5` | `#0F2431` |
| `--land-stroke` | `#A7F3D0` | `#0F5048` |
| `--road` | `#94A3B8` | `#64748B` |
| `--rail` | `#334155` | `#CBD5E1` |
| `--rail-dash` | `#FFFFFF` | `#0F172A` |
| `--dijkstra` | `#0891B2` | `#22D3EE` |
| `--astar` | `#D97706` | `#FBBF24` |
| `--route-from` | `#059669` | `#34D399` |
| `--route-to` | `#06B6D4` | `#22D3EE` |
| `--pin-start` | `#059669` | `#34D399` |
| `--pin-end` | `#E11D48` | `#FB7185` |

The final route is drawn with an SVG `linearGradient` from `--route-from` to `--route-to` (set `stop-color` with `var()`).

**Theme switch**
- A sun and moon toggle in the header, drawn as inline SVG.
- First visit follows the device setting (`prefers-color-scheme`). After the person picks, save it in `localStorage` under `nr-theme`. Wrap every `localStorage` read and write in try and catch.
- Set `data-theme` on `<html>` with a tiny inline script in `<head>`, before the CSS loads, so the page never flashes the wrong theme.
- All map colours come from the same CSS variables, so switching themes recolours the map instantly without redrawing it.
- Animate colours for 200ms when the person switches. Not on first load.
- Add two `theme-color` meta tags: `#FFFFFF` for light and `#0F172A` for dark, using the `media` attribute.
- Update `manifest.json`: `theme_color` `#059669`, `background_color` `#FFFFFF`.

**Logo:** use `assets/logo.png`. In dark theme, place it on a small white rounded chip (8px radius, 4px 8px padding) so its dark tagline stays readable.

**Contrast:** all text must reach at least 4.5 to 1 against its background in both themes. Check with DevTools.

---

## 7. Motion

### Rules for all motion
- Animate only `transform`, `opacity` and SVG `stroke-dashoffset`. Never animate width, height, top, left or margins.
- Timing: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` and `--ease: cubic-bezier(0.4, 0, 0.2, 1)` (the site's own curve). Durations 150, 200, 300 and 500ms.
- Professional and calm. Small distances, short durations. Nothing bounces more than once.
- **Reduced motion:** when `prefers-reduced-motion: reduce` is on, turn off the loader animation (show the plain loader for at most 300ms), 3D tilt, parallax and blob drift. Reveals become a plain fade under 150ms. The algorithm search and route animations still run, because they are the content.
- **The interactive map is never tilted and never moves with parallax.** It only gets the one-time entrance (B1). This keeps taps exact.
- **Demo mode (`?demo=1`):** the loader plays once as the reel intro. Then hover tilt and pointer parallax stay off.
- **Test mode (`?test=1`):** skip the loader and all reveals.
- Pause every `requestAnimationFrame` loop when the tab is hidden.
- Must stay smooth on a mid-range phone. Test in Chrome DevTools, Performance, with CPU 4x slowdown.

Put the motion code in `js/motion.js` and `css/motion.css` (or the existing CSS file if it stays under 400 lines). Put theme code in `js/theme.js`.

### A. Smooth loader
- A full-screen layer in the theme background. Its markup and CSS live inline in `index.html`, so it shows before any JavaScript loads.
- Centre: a small Tamil Nadu outline (reuse `STATE_OUTLINE`, scaled down) that draws itself with `stroke-dashoffset` in 900ms using the brand gradient. Under it, "Namma Route" and "by Wrench Wise", then a thin gradient progress bar.
- The bar fills in three real steps: data loaded, graph built, map drawn.
- Stays at least 700ms so it does not flash. At most 2500ms. Then fades out over 400ms (opacity to 0, scale 1 to 1.02) and is removed.
- Accessibility: `role="status"` with the text "Loading map".
- Safety net: a pure CSS animation hides the loader after 6 seconds even if JavaScript fails.

### B. 3D motion
- **B1. Map lift.** Right after the loader, the map card enters from `perspective(1200px) rotateX(18deg) translateY(24px) scale(0.96)` at opacity 0 to flat and visible in 900ms with `--ease-out`. When it finishes, set `transform: none`.
- **B2. Card tilt (laptop only).** Only when `(hover: hover) and (pointer: fine)` matches. The result card, the two Compare cards and the How It Works cards tilt toward the cursor, at most 6 degrees, with a soft light spot that follows the cursor (radial gradient, 8% opacity). They return to flat in 300ms when the cursor leaves. Never on the map.
- **B3. Compare flip.** The Dijkstra and A* result cards flip in with `rotateY(90deg)` to 0, 500ms each, the second one 120ms after the first. Use `backface-visibility: hidden`. Then the numbers count up.
- **B4. Pin drop.** The start and end pins drop from 16px above with one small squash, 400ms, and a soft shadow ellipse under each pin grows as it lands.

### C. Entrance reveal
- Any element with `data-reveal` fades up: opacity 0 to 1 and `translateY(16px)` to 0, 500ms, `--ease-out`.
- Elements in the same `data-reveal-group` start 60ms apart.
- Use `IntersectionObserver` (threshold 0.15). Reveal once, then stop watching that element.
- Page start order, right after the loader: header at 0ms, map lift (B1) at 100ms, panel sections one by one from 200ms.
- Apply to: header items, the From and To section, mode tabs, buttons, result card, Under the Hood panel, legend, How It Works sections, footer.
- The result card reveals again each time a new result arrives.
- Phone: the bottom sheet slides up 24px and fades in the first time it opens.
- If `IntersectionObserver` is missing, show everything at once. Never hide content from screen readers.

### D. Micro interactions
1. **Buttons:** on hover lift 1px with `--shadow-md` (200ms). On press scale to 0.97 (100ms). Keyboard focus shows a 3px ring in `--brand` at 40% opacity, 2px away from the button.
2. **Find route button:** brand gradient background. On hover the gradient slowly slides (background-size 200%, position shift over 600ms).
3. **Tap ripple:** on buttons, a circle in `--brand-soft` grows from the tap point and fades, 450ms. It must not block clicks.
4. **Swap button:** the icon turns 180 degrees in 300ms, and the From and To values slide past each other.
5. **Tabs** (Any, Road, Train and the algorithm tabs): a pill slides under the active tab, 300ms.
6. **Theme toggle:** the sun turns and shrinks out while the moon turns and grows in, 300ms.
7. **Inputs:** the border changes to `--brand` on focus, 150ms. The dropdown slides down 8px and fades in, 150ms. Matching letters in each suggestion are bold. Search also matches `aliases`.
8. **City picked:** its dot sends out one ring pulse (scale 1 to 1.8, fading out, 600ms), and the pin drops in (B4).
9. **City hover (laptop):** the dot grows to 1.3x, its label fades in and the hover card appears, 150ms.
10. **Count-up numbers:** keep the existing ones. Also count up the total time on the result card.
11. **Share link:** after copying, the button reads "Link copied" with a tick for 1.5 seconds, then goes back.
12. **Speed slider:** the thumb grows to 1.15x while dragging.
13. **Train mode:** cities without a station are dimmed to 40% on the map. In the dropdown they show "(no station)" and cannot be chosen. Tapping one on the map gives a small shake (4px left and right, 300ms) and a toast: "No railway station in Kodaikanal. Try Road or Any." (with the right city name). If From or To already holds such a city when the person switches to Train, clear that field and show the same toast.
14. **Toasts:** slide up and fade in, hide after 3 seconds.

### E. Parallax
- A decorative background layer behind the whole app: fixed position, `pointer-events: none`, `aria-hidden="true"`, behind all content. Three depth layers, matching the soft blob style on wrench-wise.com:
  - **Far:** two large blurred blobs (blur 60px). Light theme: `#A7F3D0` and `#A5F3FC` at 35% opacity. Dark theme: `#10B981` and `#06B6D4` at 12% opacity. They drift very slowly (20 second loop, alternate).
  - **Middle:** a faint dot grid, 1px dots every 24px, `--text` at 6% opacity.
  - **Near:** three thin curved dashed lines (SVG paths) at 8% opacity, like routes.
- **Laptop** (`(hover: hover) and (pointer: fine)`): the layers move opposite to the pointer, at most 6px, 12px and 20px. Smooth it with a `requestAnimationFrame` loop that moves 8% of the way each frame. Stop the loop once it settles.
- **Phone:** where the page scrolls (bottom sheet, How It Works), the layers move at 0.1x, 0.2x and 0.3x of the scroll. Do not use device tilt sensors (iPhones show a permission prompt).
- Off in reduced motion, demo mode and test mode.
- Never apply parallax to the map, the panels or any text people need to read.

---

## 8. Layout and branding changes
- **Header:** logo, "Namma Route", "by Wrench Wise", theme toggle. A 3px brand gradient bar under the header.
- **Tagline** (one line under the title, laptop only): "Find the fastest way across Tamil Nadu. Watch the computer think."
- **Info line** near the inputs: "Covers all 38 district headquarters and 17 key towns."
- **Inputs:** "From" and "To", placeholder "Type a city".
- **Background:** `--bg-grad` with the parallax layer on top.
- Keep the existing phone and laptop layouts: phone has the map in the top 60 to 65% with a bottom sheet; laptop has the map on the left (about 65%) and the panel on the right.

---

## 9. Words to update
- **Disclaimer (footer, always visible):** "Simplified map for learning. Not official. Distances and times are approximate and do not include waiting for trains or buses."
- **Compare line:** "Dijkstra checked X cities. A* checked Y. Same route, Z% less work."
- **How It Works drawer:** update every example to Tamil Nadu cities. Add one short section, "Road, train or both", explaining the 30 minute switch time and why cities are split into a road node and a train node.

---

## 10. Demo mode
- **Demo trip:** Kanyakumari to Chennai, Any mode. In my tests Dijkstra checked 49 cities and A* checked 16, about 67% less work. Your counts may differ slightly. Report yours.
- Compare these iconic trips too and use the one with the biggest gap: Kanyakumari to Chennai, Chennai to Kanyakumari, Hosur to Kanyakumari, Chennai to Rameswaram, Chennai to Tirunelveli. Do not pick an unknown town pair even if its gap is bigger. The reel needs places people know.
- **Sequence:** loader (first loop only), entrance reveal, pick From with a tap animation, pick To, run Compare, show the result and hold 3 seconds, loop.

---

## 11. Self-test (`?test=1`)
Log results to the console and show a small pass or fail box on screen.
1. **Counts:** cities 55, district headquarters 38, rail cities 49, road links 86, rail links 60. All must equal `EXPECTED`.
2. **k:** equals `EXPECTED.k` to 4 decimal places.
3. **Every trip in `EXPECTED.trips`:** Dijkstra minutes, A* minutes and BFS hops match exactly. `null` means "no route" in that mode.
4. **All pairs, all modes:** Dijkstra and A* give the same minutes for every pair. Expected pairs: Road 2970, Train 2352, Any 2970. Failures must be 0. Also report average cities checked. In my tests: Road 28.5 and 12.8, Train 25.5 and 11.5, Any 28.5 and 12.0 (Dijkstra and A*).
5. **Reachability:** every city is reachable in Road and Any. Every rail city is reachable in Train.
6. **Theme tokens:** every token in Section 6 has a value in both themes.
7. **Console:** no errors.

If any check fails, stop and report. Do not change `tn-data.js` to make a test pass.

---

## 12. Phases

### Phase 0: Backup and read (target 15 min)
1. Run `git status`. If anything is uncommitted, commit it with the message "Chennai version before Tamil Nadu upgrade".
2. Tag it: `git tag chennai-v1`.
3. Create and switch to a new branch: `git checkout -b tamil-nadu`. Do all work on this branch. The live site stays untouched.
4. Push the branch to GitHub. Vercel will make a separate preview link for it.
5. Read every file in the project.

**Report:** each file and what it does in one line, how the data flows from `data.js` to the screen, and the Vercel preview link (or click steps for me to find it).

### Phase 1: Data and brain (target 45 min)
- Import from `js/tn-data.js`. Remove the old metro data file and every import of it.
- Rebuild `graph.js` for the model in Section 4, with the three travel modes.
- Update Dijkstra, A* and BFS for multi-node start and finish, and the city counting.
- Build the self-test from Section 11.

**Report:** counts, k, the full self-test result, and a table of every `EXPECTED` trip with your numbers next to mine. Also the demo trip counts from Section 10.

### Phase 2: Map and basic route (target 60 min)
- Draw the outline, links (with offsets), dots, labels with tier rules, and the legend.
- Zoom and pan with `viewBox`, plus Reset View.
- Mode tabs, the dimmed cities in Train mode, picking by search (with aliases) and by tap.
- Result card with step text for all three algorithms.

**Report:** screenshots at 390 x 844 and 1440 x 900, and the result card for Chennai to Ooty in Any mode. It must show 707 minutes ("about 11 h 47 min") with a switch from train to road at Mettupalayam.

### Phase 3: Theme (target 40 min)
- Tokens, light and dark themes, the toggle, no flash on load, logo chip in dark theme, `theme-color` and `manifest.json` updates, contrast check.

**Report:** screenshots of both themes at both sizes, and a list of any colour pairs that failed the contrast check and how you fixed them.

### Phase 4: Motion (target 75 min)
- Build Section 7 in this order: A loader, C entrance reveal, B 3D motion, D micro interactions, E parallax.

**Report:** a short list of every effect and where it appears. Confirm reduced motion works (DevTools, Rendering, Emulate CSS prefers-reduced-motion). Confirm taps still pick the right city at 1x and 3x zoom.

### Phase 5: Polish and demo (target 30 min)
- Update Demo mode (Section 10).
- Run a Lighthouse test on mobile. Performance should be 90 or higher, and layout shift (CLS) under 0.05.
- Keyboard test: Tab through every control. Focus must always be visible.

**Report:** the Lighthouse scores, the chosen demo trip with both counts, and any bugs left.

### Phase 6: Docs and deploy (target 30 min)
- Update `README.md`, `EXPLAINER.md` and `REEL_SCRIPT.md` for Tamil Nadu. Same rules as before: plain language, no emojis, no em dashes.
- In `sw.js`, change the cache name (for example to `namma-route-v2`) and add every new file to the cache list. Without this, returning visitors keep seeing the old Chennai version.
- Push the branch. Check the Vercel preview link on a phone-sized screen.
- Then stop. Merge into `main` (which updates the live site) only after I reply "Ship it". When I do, give me click steps to confirm the live link shows the new version.

**Report:** the preview link, and anything that does not work on the preview.

---

## 13. If we are running late
If I say "We're behind, apply the cut list", drop these in order:
1. Phone scroll parallax (keep laptop pointer parallax).
2. Card tilt (B2).
3. Tap ripple (D3).
4. Tier 2 labels on phone (show tier 1 only).

Never cut: the Tamil Nadu data and travel modes, both themes, the loader, entrance reveal, map lift, Compare flip, laptop parallax, Compare mode, Demo mode, the self-test, the disclaimer, deployment.

---

## 14. Phase Report format
- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop, both themes where relevant)
- **Not working or cut,** in plain words
- **Time used** against the target
