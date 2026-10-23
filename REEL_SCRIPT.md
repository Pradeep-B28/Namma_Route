# Namma Route: Social Media Reel Scripts

Two recording scripts matched directly to Demo Mode timing.

No emojis. No em dashes.

---

## Version 1: Vertical Reel (30 Seconds, 9:16 Format)

**Target Audience:** Students, self-taught programmers, social media scrollers.  
**Screen Setup:** Mobile screen recording in 9:16 portrait orientation (`?demo=1`).

| Timestamp | Shot Description | On-Screen Text (Captions) | Voiceover (Optional) |
|---|---|---|---|
| 0:00 - 0:02 | Screen opens on Chennai transit map with dark theme. Demo cursor lands on Nandanam with a golden tap pulse. | How Google Maps actually finds your route in milliseconds. | Have you ever wondered how navigation apps find the fastest route? |
| 0:02 - 0:05 | Demo cursor moves north across the city to Tiruvottriyur Theradi and taps. Start and destination highlight. | Step 1: Pick start and destination across Chennai. | Let us pick a trip across Chennai from Nandanam to Tiruvottriyur. |
| 0:05 - 0:13 | Dijkstra starts. Cyan search waves ripple outward in every direction across the city, exploring 56 stations. | Dijkstra Algorithm: Searches in every direction blind. Checked: 56 stations. | Dijkstra searches everywhere outward in circles. It checks 56 stations before finding the destination. |
| 0:13 - 0:15 | Map clears. A* starts. Amber ripples target directly north toward the goal. | A* Algorithm: Uses straight-line distance to guide search. | Now watch A-star. It uses a sense of direction. |
| 0:15 - 0:21 | A* reaches destination in only 24 station checks. Glowing golden route draws itself along the metro line. | A* checked only 24 stations. Route lights up in 30 minutes. | It heads straight for the destination, checking only 24 stations. |
| 0:21 - 0:27 | Comparison card pops up with animated count-up numbers: 56 vs 24. | Same 30 min route. 57% less work. | Exact same route and time, but 57% less computer work. |
| 0:27 - 0:30 | Call to action card with logo and link. | Learn Data Structures and Algorithms with Wrench Wise. Try it live at nammaroute-sigma.vercel.app | Master algorithms visually with Wrench Wise. |

---

## Version 2: Horizontal Video (60 Seconds, 16:9 Format)

**Target Audience:** DSA students, tech enthusiasts, LinkedIn viewers, parents.  
**Screen Setup:** Laptop desktop split-screen recording in 16:9 landscape (`?demo=1`).

| Timestamp | Shot Description | On-Screen Text (Captions) | Voiceover (Optional) |
|---|---|---|---|
| 0:00 - 0:03 | Wide view of desktop UI with dark theme, transit lines, and live panels. Map on left, Under the Hood on right. | Dijkstra vs A*: Visualizing the algorithm behind navigation apps. | What is the difference between Dijkstra and A-star? Let us see it visually on Chennai transit network. |
| 0:03 - 0:08 | Tap animation on Nandanam, then tap animation on Tiruvottriyur Theradi. Station dots glow in brand colors. | Cross-city route: Nandanam to Tiruvottriyur Theradi. | We set our trip from Nandanam in South Chennai to Tiruvottriyur in the North. |
| 0:08 - 0:20 | Dijkstra animation runs. Soft cyan waves ripple across Green Line, MRTS, and Central. Counter counts to 56. Priority queue updates live. | Dijkstra algorithm: Radial expansion without direction. Visited 56 of 59 stations. | First, we run Dijkstra. Because Dijkstra has no sense of where the destination is, it searches in every direction. It checks Green Line, MRTS, and Central, visiting 56 stations. |
| 0:20 - 0:23 | Brief pause. Explored cyan dots fade cleanly. Narration panel switches to A* mode. | Clearing map. Now running A* search with Euclidean heuristic. | Now watch what happens when we give the computer a compass. |
| 0:23 - 0:35 | A* search runs. Focused golden ripples head directly north along the Blue Line corridor. Counter stops at 24. | A* algorithm: Guided by straight-line distance estimate. Checked only 24 stations. | This is A-star. At every station, it estimates straight-line distance to the goal. It refuses to explore backward stations, checking only 24 stations. |
| 0:35 - 0:43 | Golden glowing route draws itself smoothly along the line from start to end with white core stroke. | Optimal route found: 30 minutes, 15 stops. | Both algorithms find the exact same 30-minute fastest route. |
| 0:43 - 0:53 | Compare card animates numbers side by side. 56 vs 24. Work reduction counter shows 57% less work. | Dijkstra: 56 stations checked. A*: 24 stations checked. 57% less computational work. | But A-star checked 32 fewer stations. That is 57% less work for the exact same result. This is why modern map services use heuristic search. |
| 0:53 - 1:00 | Under the Hood drawer opens briefly, showing min-heap and Big-O table. Closing card with Wrench Wise branding. | Build real CS intuition. Namma Route by Wrench Wise. Try it at nammaroute-sigma.vercel.app | Understand computer science from first principles with Wrench Wise. Try it live today. |

---

## Production Notes

1. **Recording Tips:**
   - Use Google Chrome or Microsoft Edge at 100% display scale.
   - For vertical reels, set browser window to 390 by 844 or use developer tools mobile frame.
   - For horizontal video, set browser window to 1440 by 900 or 1920 by 1080.
   - Navigate to `?demo=1` to record uninterrupted looping footage.

2. **Style Compliance:**
   - No emojis in any on-screen text or captions.
   - No em dashes in voiceover or overlays.
   - All branding matches Wrench Wise guidelines.
