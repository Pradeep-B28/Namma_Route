// Pathfinding algorithms for Namma Route: Tamil Nadu Transit Network
// Implements Dijkstra, A*, and BFS as JavaScript generators
// Each algorithm yields step events for animation and step-by-step playback

import { MinHeap } from './heap.js';
import { reconstructPath, reconstructBfsPath, generateStepInstructions, formatMinutes } from './route.js';

function normalizeMode(mode) {
  if (!mode) return 'any';
  const m = mode.toLowerCase();
  return m === 'train' ? 'rail' : m;
}

function makeEmptyResult(algorithm, msg = 'No route found.', citiesChecked = 0, visited = []) {
  return {
    type: 'done',
    algorithm,
    success: false,
    totalTime: null,
    hops: null,
    totalKm: 0,
    citiesChecked,
    visitedCities: Array.from(visited),
    path: [],
    stepsText: [msg],
    stops: 0,
    switches: 0
  };
}

function makeSameCityResult(algorithm, cityId, normMode) {
  const nodeType = normMode === 'rail' ? 'rail' : 'road';
  return {
    type: 'done',
    algorithm,
    success: true,
    totalTime: 0,
    hops: 0,
    totalKm: 0,
    citiesChecked: 1,
    visitedCities: [cityId],
    path: [{ cityId, nodeId: `${cityId}:${nodeType}`, type: nodeType, edgeFromPrev: null }],
    stepsText: ['You are already at the destination.'],
    stops: 0,
    switches: 0
  };
}

function formatQueueSnapshot(heap, graph, isAstar = false) {
  return heap.getTop(5).map((e) => {
    const n = graph.nodes[e.item.nodeId];
    const c = graph.cities[n.cityId];
    const t = n.type === 'rail' ? 'train' : 'road';
    const label = isAstar
      ? `${c.name} (${t}) ${formatMinutes(e.item.g)} + est ${formatMinutes(e.item.h)}`
      : `${c.name} (${t}) ${formatMinutes(e.item.g)}`;
    return { cityName: c.name, type: t, cost: e.item.g, estimate: e.item.h, fScore: e.priority, label };
  });
}

// Dijkstra generator
export function* dijkstra(graph, startCityId, targetCityId, mode = 'any') {
  const normMode = normalizeMode(mode);
  yield { type: 'start', algorithm: 'dijkstra', startCityId, targetCityId, mode: normMode };

  const startCity = graph.cities[startCityId];
  const targetCity = graph.cities[targetCityId];

  if (normMode === 'rail' && (!startCity?.rail || !targetCity?.rail)) {
    yield makeEmptyResult('dijkstra', 'No railway station available for the selected trip.');
    return;
  }
  if (startCityId === targetCityId) {
    yield makeSameCityResult('dijkstra', startCityId, normMode);
    return;
  }

  let startNodeIds = graph.cityNodes[startCityId] || [];
  if (normMode === 'road') startNodeIds = startNodeIds.filter((id) => id.endsWith(':road'));
  else if (normMode === 'rail') startNodeIds = startNodeIds.filter((id) => id.endsWith(':rail'));

  const dist = {};
  const prev = {};
  const settled = new Set();
  const visitedCities = new Set();
  const heap = new MinHeap();

  for (const nid of startNodeIds) {
    dist[nid] = 0;
    heap.push({ nodeId: nid, g: 0 }, 0, nid);
  }

  while (!heap.isEmpty()) {
    const { nodeId, g } = heap.pop();
    if (settled.has(nodeId) || g > (dist[nodeId] ?? Infinity)) continue;
    settled.add(nodeId);

    const currentNode = graph.nodes[nodeId];
    visitedCities.add(currentNode.cityId);
    const cityName = graph.cities[currentNode.cityId].name;
    const modeWord = currentNode.type === 'rail' ? 'train' : 'road';

    yield {
      type: 'visit',
      algorithm: 'dijkstra',
      nodeId,
      cityId: currentNode.cityId,
      cityName,
      nodeType: currentNode.type,
      time: g,
      gScore: g,
      fScore: g,
      citiesChecked: visitedCities.size,
      queueSnapshot: formatQueueSnapshot(heap, graph, false),
      narration: `Checking ${cityName} by ${modeWord}. We can reach it in ${formatMinutes(g)}. Adding its neighbours to the queue.`
    };

    if (currentNode.cityId === targetCityId) {
      const { path, switches, stops, totalKm, totalTime } = reconstructPath(nodeId, prev, graph);
      yield {
        type: 'done',
        algorithm: 'dijkstra',
        success: true,
        totalTime,
        totalKm,
        citiesChecked: visitedCities.size,
        visitedCities: Array.from(visitedCities),
        path,
        stepsText: generateStepInstructions(path, graph),
        stops,
        switches
      };
      return;
    }

    for (const edge of currentNode.neighbors) {
      if (normMode === 'road' && edge.type !== 'road') continue;
      if (normMode === 'rail' && edge.type !== 'rail') continue;

      const newG = g + edge.min;
      if (newG < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = newG;
        prev[edge.to] = { fromNodeId: nodeId, edge };
        heap.push({ nodeId: edge.to, g: newG }, newG, edge.to);
        yield { type: 'queue', algorithm: 'dijkstra', fromNodeId: nodeId, toNodeId: edge.to, toCityId: edge.toCityId, cost: newG, priority: newG, edgeType: edge.type };
      }
    }
  }

  yield makeEmptyResult('dijkstra', 'No route found.', visitedCities.size, visitedCities);
}

// A* generator
export function* astar(graph, startCityId, targetCityId, mode = 'any') {
  const normMode = normalizeMode(mode);
  yield { type: 'start', algorithm: 'astar', startCityId, targetCityId, mode: normMode };

  const startCity = graph.cities[startCityId];
  const targetCity = graph.cities[targetCityId];

  if (normMode === 'rail' && (!startCity?.rail || !targetCity?.rail)) {
    yield makeEmptyResult('astar', 'No railway station available for the selected trip.');
    return;
  }
  if (startCityId === targetCityId) {
    yield makeSameCityResult('astar', startCityId, normMode);
    return;
  }

  let startNodeIds = graph.cityNodes[startCityId] || [];
  if (normMode === 'road') startNodeIds = startNodeIds.filter((id) => id.endsWith(':road'));
  else if (normMode === 'rail') startNodeIds = startNodeIds.filter((id) => id.endsWith(':rail'));

  const dist = {};
  const prev = {};
  const settled = new Set();
  const visitedCities = new Set();
  const heap = new MinHeap();
  const hStart = graph.heuristic(startCityId, targetCityId);

  for (const nid of startNodeIds) {
    dist[nid] = 0;
    heap.push({ nodeId: nid, g: 0, h: hStart }, hStart, nid);
  }

  while (!heap.isEmpty()) {
    const { nodeId, g, h } = heap.pop();
    if (settled.has(nodeId) || g > (dist[nodeId] ?? Infinity)) continue;
    settled.add(nodeId);

    const currentNode = graph.nodes[nodeId];
    visitedCities.add(currentNode.cityId);
    const cityName = graph.cities[currentNode.cityId].name;
    const modeWord = currentNode.type === 'rail' ? 'train' : 'road';

    yield {
      type: 'visit',
      algorithm: 'astar',
      nodeId,
      cityId: currentNode.cityId,
      cityName,
      nodeType: currentNode.type,
      time: g,
      gScore: g,
      fScore: g + h,
      hScore: h,
      citiesChecked: visitedCities.size,
      queueSnapshot: formatQueueSnapshot(heap, graph, true),
      narration: `Checking ${cityName} by ${modeWord}. We can reach it in ${formatMinutes(g)}, estimate ${formatMinutes(h)} to destination.`
    };

    if (currentNode.cityId === targetCityId) {
      const { path, switches, stops, totalKm, totalTime } = reconstructPath(nodeId, prev, graph);
      yield {
        type: 'done',
        algorithm: 'astar',
        success: true,
        totalTime,
        totalKm,
        citiesChecked: visitedCities.size,
        visitedCities: Array.from(visitedCities),
        path,
        stepsText: generateStepInstructions(path, graph),
        stops,
        switches
      };
      return;
    }

    for (const edge of currentNode.neighbors) {
      if (normMode === 'road' && edge.type !== 'road') continue;
      if (normMode === 'rail' && edge.type !== 'rail') continue;

      const newG = g + edge.min;
      if (newG < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = newG;
        prev[edge.to] = { fromNodeId: nodeId, edge };
        const toNode = graph.nodes[edge.to];
        const neighborH = graph.heuristic(toNode.cityId, targetCityId);
        const fScore = newG + neighborH;
        heap.push({ nodeId: edge.to, g: newG, h: neighborH }, fScore, edge.to);
        yield { type: 'queue', algorithm: 'astar', fromNodeId: nodeId, toNodeId: edge.to, toCityId: edge.toCityId, cost: newG, priority: fScore, edgeType: edge.type };
      }
    }
  }

  yield makeEmptyResult('astar', 'No route found.', visitedCities.size, visitedCities);
}

// BFS generator (runs on city graph, ignores travel time, finds fewest stops)
export function* bfs(graph, startCityId, targetCityId, mode = 'any') {
  const normMode = normalizeMode(mode);
  yield { type: 'start', algorithm: 'bfs', startCityId, targetCityId, mode: normMode };

  const startCity = graph.cities[startCityId];
  const targetCity = graph.cities[targetCityId];

  if (normMode === 'rail' && (!startCity?.rail || !targetCity?.rail)) {
    yield makeEmptyResult('bfs', 'No railway station available for the selected trip.');
    return;
  }
  if (startCityId === targetCityId) {
    yield makeSameCityResult('bfs', startCityId, normMode);
    return;
  }

  const queue = [{ cityId: startCityId, hops: 0 }];
  const visited = new Set([startCityId]);
  const prev = {};

  while (queue.length > 0) {
    const { cityId, hops } = queue.shift();
    const city = graph.cities[cityId];

    yield {
      type: 'visit',
      algorithm: 'bfs',
      cityId,
      cityName: city.name,
      hops,
      citiesChecked: visited.size,
      queueSnapshot: queue.slice(0, 5).map((q) => ({
        cityName: graph.cities[q.cityId].name,
        label: `${graph.cities[q.cityId].name} (${q.hops} stops)`
      })),
      narration: `Checking ${city.name}. Exploring neighbouring cities.`
    };

    if (cityId === targetCityId) {
      const cityPath = [];
      let curr = targetCityId;
      while (curr) {
        cityPath.unshift(curr);
        curr = prev[curr];
      }

      const { path, switches, stops, totalKm, totalTime } = reconstructBfsPath(cityPath, normMode, graph);
      yield {
        type: 'done',
        algorithm: 'bfs',
        success: true,
        totalTime,
        hops: cityPath.length - 1,
        totalKm,
        citiesChecked: visited.size,
        visitedCities: Array.from(visited),
        path,
        stepsText: generateStepInstructions(path, graph),
        stops,
        switches
      };
      return;
    }

    const neighbors = graph.cityGraph[normMode][cityId] || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        prev[neighborId] = cityId;
        queue.push({ cityId: neighborId, hops: hops + 1 });
        yield { type: 'queue', algorithm: 'bfs', fromCityId: cityId, toCityId: neighborId };
      }
    }
  }

  yield makeEmptyResult('bfs', 'No route found.', visited.size, visited);
}

// Run a generator synchronously to completion
export function runAlgorithm(generator) {
  let result = null;
  for (const step of generator) {
    if (step.type === 'done') result = step;
  }
  return result;
}

// Convenience pathfinding function
export function findRoute(graph, startCityId, targetCityId, algorithmName = 'dijkstra', mode = 'any') {
  let gen;
  if (algorithmName === 'astar') gen = astar(graph, startCityId, targetCityId, mode);
  else if (algorithmName === 'bfs') gen = bfs(graph, startCityId, targetCityId, mode);
  else gen = dijkstra(graph, startCityId, targetCityId, mode);
  return runAlgorithm(gen);
}
