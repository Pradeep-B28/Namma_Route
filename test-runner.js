// Test runner for Phase 1 verification in Node.js
import { buildGraph } from './js/graph.js';
import { runSelfTest } from './js/test.js';
import { findRoute } from './js/algorithms.js';

console.log('Building graph...');
const graph = buildGraph();

console.log('Graph metrics:');
console.log(`- Stations count: ${graph.stationCount}`);
console.log(`- Line nodes count: ${graph.lineNodeCount}`);
console.log(`- Directed edges count: ${graph.directedEdgeCount}`);
console.log(`- Undirected edges count: ${graph.undirectedEdgeCount}`);
console.log(`- Heuristic k (min ratio): ${graph.k}`);

console.log('\nRunning self-test across all station pairs...');
const startTime = Date.now();
const results = runSelfTest(graph);
const durationMs = Date.now() - startTime;

console.log(`\nSelf-test completed in ${durationMs}ms`);
console.log(`- Pairs tested: ${results.pairsTested}`);
console.log(`- Passed: ${results.passed}`);
console.log(`- Failures count: ${results.failures.length}`);
if (results.failures.length > 0) {
  console.log('Failures:', JSON.stringify(results.failures.slice(0, 5), null, 2));
}
console.log(`- Average Dijkstra stations checked: ${results.avgDijkstraStations}`);
console.log(`- Average A* stations checked: ${results.avgAstarStations}`);

console.log('\nChosen Demo Trip:');
console.log(`- From: ${results.demoTrip.startName} (${results.demoTrip.start})`);
console.log(`- To: ${results.demoTrip.endName} (${results.demoTrip.end})`);
console.log(`- Dijkstra checked: ${results.demoTrip.dijkstraStations} stations`);
console.log(`- A* checked: ${results.demoTrip.astarStations} stations`);
console.log(`- Work reduction: ${results.demoTrip.reductionPercent}% (${results.demoTrip.gap} fewer stations)`);
console.log(`- Total trip time: ${results.demoTrip.time} min`);

const bfsResult = findRoute(graph, results.demoTrip.start, results.demoTrip.end, 'bfs');
console.log(`- BFS checked: ${bfsResult.stationsChecked} stations, stops: ${bfsResult.stops}, time: ${bfsResult.totalTime} min`);
