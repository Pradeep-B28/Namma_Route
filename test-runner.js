// Node.js test runner for Phase 1 verification
import { buildGraph } from './js/graph.js';
import { runSelfTest } from './js/test.js';

console.log('Building Tamil Nadu transit network graph...');
const graph = buildGraph();

console.log('\n--- NETWORK METRICS ---');
console.log(`- Total cities: ${graph.cityCount}`);
console.log(`- Road nodes: ${graph.roadNodeCount}`);
console.log(`- Rail nodes: ${graph.railNodeCount}`);
console.log(`- Total graph nodes: ${graph.totalNodeCount}`);
console.log(`- Directed edges: ${graph.edges.length}`);
console.log(`- Heuristic k constant: ${graph.k} (Expected: ${graph.expected.k})`);

console.log('\nRunning comprehensive Section 11 self-test suite...');
const startTime = performance.now();
const results = runSelfTest(graph);
const elapsed = Math.round(performance.now() - startTime);

console.log(`\nSelf-test finished in ${elapsed} ms.`);
console.log(`OVERALL STATUS: ${results.passed ? 'PASSED (0 failures)' : 'FAILED'}`);

if (!results.passed) {
  console.error('Failures encountered:', JSON.stringify(results.failures, null, 2));
}

console.log('\n--- 1. COUNTS CHECK ---');
console.log(`- Cities: ${results.checks.counts.cities} (Expected: ${graph.expected.cities})`);
console.log(`- District HQs: ${results.checks.counts.districtHQs} (Expected: ${graph.expected.districtHQs})`);
console.log(`- Rail cities: ${results.checks.counts.railCities} (Expected: ${graph.expected.railCities})`);
console.log(`- Road links: ${results.checks.counts.roadLinks} (Expected: ${graph.expected.roadLinks})`);
console.log(`- Rail links: ${results.checks.counts.railLinks} (Expected: ${graph.expected.railLinks})`);

console.log('\n--- 2. K CONSTANT CHECK ---');
console.log(`- Calculated k: ${results.checks.k.calculated}`);
console.log(`- Expected k:   ${results.checks.k.expected}`);
console.log(`- Diff:         ${results.checks.k.diff.toExponential(4)} (Passed: ${results.checks.k.passed})`);

console.log('\n--- 3. EXPECTED TRIPS TABLE ---');
console.log('| From | To | Mode | Expected Time | Actual D Time | Actual A* Time | Expected Hops | Actual BFS Hops | Result |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const t of results.checks.trips.list) {
  const expTime = t.expected.minutes === null ? 'null' : `${t.expected.minutes}m`;
  const actDTime = t.actual.dMin === null ? 'null' : `${t.actual.dMin}m`;
  const actATime = t.actual.aMin === null ? 'null' : `${t.actual.aMin}m`;
  const expHops = t.expected.hops === null ? 'null' : `${t.expected.hops}`;
  const actHops = t.actual.bHops === null ? 'null' : `${t.actual.bHops}`;
  const status = t.passed ? 'PASS' : 'FAIL';
  console.log(`| ${t.from} | ${t.to} | ${t.mode} | ${expTime} | ${actDTime} | ${actATime} | ${expHops} | ${actHops} | ${status} |`);
}

console.log('\n--- 4. ALL PAIRS TEST ACROSS ALL MODES ---');
console.log(`- Road mode: pairs = ${results.checks.allPairs.road.pairsTested}, failures = ${results.checks.allPairs.road.modeFailures}, avg Dijkstra = ${results.checks.allPairs.road.avgDijkstra}, avg A* = ${results.checks.allPairs.road.avgAstar}`);
console.log(`- Rail mode: pairs = ${results.checks.allPairs.rail.pairsTested}, failures = ${results.checks.allPairs.rail.modeFailures}, avg Dijkstra = ${results.checks.allPairs.rail.avgDijkstra}, avg A* = ${results.checks.allPairs.rail.avgAstar}`);
console.log(`- Any mode:  pairs = ${results.checks.allPairs.any.pairsTested}, failures = ${results.checks.allPairs.any.modeFailures}, avg Dijkstra = ${results.checks.allPairs.any.avgDijkstra}, avg A* = ${results.checks.allPairs.any.avgAstar}`);
console.log(`- Total pairs tested: ${results.checks.allPairs.totalPairs}`);
console.log(`- Total failures: ${results.checks.allPairs.totalFailures}`);

console.log('\n--- 5. REACHABILITY ---');
console.log(`- Road reachability: ${results.checks.reachability.road}`);
console.log(`- Rail reachability: ${results.checks.reachability.rail}`);
console.log(`- Any reachability:  ${results.checks.reachability.any}`);

console.log('\n--- 6. DEMO ICONIC TRIPS COMPARISON ---');
for (const d of results.demoComparisons) {
  console.log(`- ${d.fromName} -> ${d.toName}: Dijkstra = ${d.dijkstraChecked}, A* = ${d.astarChecked}, gap = ${d.gap} (${d.reductionPercent}% less work), time = ${d.minutes} min`);
}
console.log(`\nBest demo trip: ${results.bestDemo.fromName} to ${results.bestDemo.toName} (Gap: ${results.bestDemo.gap} cities, ${results.bestDemo.reductionPercent}% less work)`);
