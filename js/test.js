// Self-test suite for Namma Route
// Validates reachability and verifies that Dijkstra and A*
// produce identical travel times across all station pairs.
// Also calculates the best demo trip (maximum station count gap).

import { dijkstra, astar, runAlgorithm } from './algorithms.js';

export function runSelfTest(graph) {
  const stationIds = Object.keys(graph.stations);
  let pairsTested = 0;
  const failures = [];
  let totalDijkstraStations = 0;
  let totalAstarStations = 0;
  let maxGap = -1;
  let demoTrip = null;

  for (let i = 0; i < stationIds.length; i++) {
    for (let j = 0; j < stationIds.length; j++) {
      if (i === j) continue;
      const start = stationIds[i];
      const end = stationIds[j];
      pairsTested++;

      const dResult = runAlgorithm(dijkstra(graph, start, end));
      const aResult = runAlgorithm(astar(graph, start, end));

      if (!dResult || !aResult) {
        failures.push({
          start,
          end,
          reason: 'Algorithm returned null result'
        });
        continue;
      }

      if (!dResult.success || !aResult.success) {
        failures.push({
          start,
          end,
          reason: `Unreachable: Dijkstra success=${dResult.success}, A* success=${aResult.success}`
        });
        continue;
      }

      if (dResult.totalTime !== aResult.totalTime) {
        failures.push({
          start,
          end,
          dijkstraTime: dResult.totalTime,
          astarTime: aResult.totalTime
        });
      }

      totalDijkstraStations += dResult.stationsChecked;
      totalAstarStations += aResult.stationsChecked;

      const gap = dResult.stationsChecked - aResult.stationsChecked;
      if (gap > maxGap) {
        maxGap = gap;
        demoTrip = {
          start,
          end,
          startName: graph.stations[start].name,
          endName: graph.stations[end].name,
          dijkstraStations: dResult.stationsChecked,
          astarStations: aResult.stationsChecked,
          gap,
          reductionPercent: Math.round((gap / dResult.stationsChecked) * 100),
          time: dResult.totalTime
        };
      }
    }
  }

  const avgDijkstra = (totalDijkstraStations / pairsTested).toFixed(1);
  const avgAstar = (totalAstarStations / pairsTested).toFixed(1);

  return {
    pairsTested,
    failures,
    avgDijkstraStations: parseFloat(avgDijkstra),
    avgAstarStations: parseFloat(avgAstar),
    demoTrip,
    passed: failures.length === 0
  };
}
