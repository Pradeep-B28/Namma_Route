// Pathfinding algorithms for Namma Route
// Implements Dijkstra, A*, and BFS as JavaScript generators
// Each algorithm yields step events for animation and step-by-step playback

import { MinHeap } from './heap.js';
import { CONNECTORS } from './data.js';
import { reconstructPath, generateStepInstructions } from './route.js';

// Dijkstra generator
export function* dijkstra(graph, startStationId, targetStationId) {
  yield { type: 'start', algorithm: 'dijkstra', startStationId, targetStationId };

  if (startStationId === targetStationId) {
    const station = graph.stations[startStationId];
    yield {
      type: 'done',
      algorithm: 'dijkstra',
      success: true,
      totalTime: 0,
      stationsChecked: 1,
      visitedStations: [startStationId],
      path: [{ stationId: startStationId, lineId: station.lines[0] || null, edgeFromPrev: null }],
      stepsText: ['You are already at the destination.'],
      stops: 0,
      lineChanges: 0
    };
    return;
  }

  const dist = {};
  const prev = {};
  const settledNodes = new Set();
  const visitedStations = new Set();
  const heap = new MinHeap();
  const startStation = graph.stations[startStationId];

  for (const nodeId of startStation.lineNodeIds) {
    dist[nodeId] = 0;
    heap.push({ nodeId, g: 0 }, 0);
  }

  while (!heap.isEmpty()) {
    const current = heap.pop();
    const { nodeId, g } = current;

    if (settledNodes.has(nodeId) || g > (dist[nodeId] ?? Infinity)) continue;
    settledNodes.add(nodeId);

    const currentNode = graph.lineNodes[nodeId];
    visitedStations.add(currentNode.stationId);

    yield {
      type: 'visit',
      algorithm: 'dijkstra',
      nodeId,
      stationId: currentNode.stationId,
      lineId: currentNode.lineId,
      stationName: currentNode.stationName,
      time: g,
      gScore: g,
      fScore: g,
      stationsChecked: visitedStations.size,
      queueSnapshot: heap.getTop(5).map(e => ({
        stationName: graph.lineNodes[e.item.nodeId].stationName,
        lineId: graph.lineNodes[e.item.nodeId].lineId,
        cost: e.priority
      })),
      narration: `Checking ${currentNode.stationName}. Reached in ${g} min.`
    };

    if (currentNode.stationId === targetStationId) {
      const { path, lineChanges, stops } = reconstructPath(nodeId, prev, graph);
      yield {
        type: 'done',
        algorithm: 'dijkstra',
        success: true,
        totalTime: g,
        stationsChecked: visitedStations.size,
        visitedStations: Array.from(visitedStations),
        path,
        stepsText: generateStepInstructions(path, graph),
        stops,
        lineChanges
      };
      return;
    }

    for (const edge of currentNode.neighbors) {
      const newG = g + edge.minutes;
      if (newG < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = newG;
        prev[edge.to] = { fromNodeId: nodeId, edge };
        heap.push({ nodeId: edge.to, g: newG }, newG);
        yield {
          type: 'queue',
          algorithm: 'dijkstra',
          fromNodeId: nodeId,
          toNodeId: edge.to,
          toStationId: edge.toStationId,
          cost: newG,
          priority: newG,
          edgeType: edge.type
        };
      }
    }
  }

  yield {
    type: 'done',
    algorithm: 'dijkstra',
    success: false,
    totalTime: Infinity,
    stationsChecked: visitedStations.size,
    visitedStations: Array.from(visitedStations),
    path: [],
    stepsText: ['No route found.'],
    stops: 0,
    lineChanges: 0
  };
}

// A* generator
export function* astar(graph, startStationId, targetStationId) {
  yield { type: 'start', algorithm: 'astar', startStationId, targetStationId };

  if (startStationId === targetStationId) {
    const station = graph.stations[startStationId];
    yield {
      type: 'done',
      algorithm: 'astar',
      success: true,
      totalTime: 0,
      stationsChecked: 1,
      visitedStations: [startStationId],
      path: [{ stationId: startStationId, lineId: station.lines[0] || null, edgeFromPrev: null }],
      stepsText: ['You are already at the destination.'],
      stops: 0,
      lineChanges: 0
    };
    return;
  }

  const dist = {};
  const prev = {};
  const settledNodes = new Set();
  const visitedStations = new Set();
  const heap = new MinHeap();
  const startStation = graph.stations[startStationId];

  for (const nodeId of startStation.lineNodeIds) {
    dist[nodeId] = 0;
    const h = graph.heuristic(startStationId, targetStationId);
    heap.push({ nodeId, g: 0, h }, 0 + h);
  }

  while (!heap.isEmpty()) {
    const current = heap.pop();
    const { nodeId, g, h } = current;

    if (settledNodes.has(nodeId) || g > (dist[nodeId] ?? Infinity)) continue;
    settledNodes.add(nodeId);

    const currentNode = graph.lineNodes[nodeId];
    visitedStations.add(currentNode.stationId);

    yield {
      type: 'visit',
      algorithm: 'astar',
      nodeId,
      stationId: currentNode.stationId,
      lineId: currentNode.lineId,
      stationName: currentNode.stationName,
      time: g,
      gScore: g,
      fScore: g + h,
      hScore: h,
      stationsChecked: visitedStations.size,
      queueSnapshot: heap.getTop(5).map(e => ({
        stationName: graph.lineNodes[e.item.nodeId].stationName,
        lineId: graph.lineNodes[e.item.nodeId].lineId,
        cost: e.item.g,
        estimate: Math.round(e.item.h),
        fScore: Math.round(e.priority)
      })),
      narration: `Checking ${currentNode.stationName}. Reached in ${g} min, estimate ${Math.round(h)} min to destination.`
    };

    if (currentNode.stationId === targetStationId) {
      const { path, lineChanges, stops } = reconstructPath(nodeId, prev, graph);
      yield {
        type: 'done',
        algorithm: 'astar',
        success: true,
        totalTime: g,
        stationsChecked: visitedStations.size,
        visitedStations: Array.from(visitedStations),
        path,
        stepsText: generateStepInstructions(path, graph),
        stops,
        lineChanges
      };
      return;
    }

    for (const edge of currentNode.neighbors) {
      const newG = g + edge.minutes;
      if (newG < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = newG;
        prev[edge.to] = { fromNodeId: nodeId, edge };
        const neighborH = graph.heuristic(edge.toStationId, targetStationId);
        const fScore = newG + neighborH;
        heap.push({ nodeId: edge.to, g: newG, h: neighborH }, fScore);
        yield {
          type: 'queue',
          algorithm: 'astar',
          fromNodeId: nodeId,
          toNodeId: edge.to,
          toStationId: edge.toStationId,
          cost: newG,
          priority: fScore,
          edgeType: edge.type
        };
      }
    }
  }

  yield {
    type: 'done',
    algorithm: 'astar',
    success: false,
    totalTime: Infinity,
    stationsChecked: visitedStations.size,
    visitedStations: Array.from(visitedStations),
    path: [],
    stepsText: ['No route found.'],
    stops: 0,
    lineChanges: 0
  };
}

// BFS generator (runs on station-level graph, finds fewest stops)
export function* bfs(graph, startStationId, targetStationId) {
  yield { type: 'start', algorithm: 'bfs', startStationId, targetStationId };

  if (startStationId === targetStationId) {
    yield {
      type: 'done',
      algorithm: 'bfs',
      success: true,
      totalTime: 0,
      stationsChecked: 1,
      visitedStations: [startStationId],
      path: [{ stationId: startStationId, lineId: null, edgeFromPrev: null }],
      stepsText: ['You are already at the destination.'],
      stops: 0,
      lineChanges: 0
    };
    return;
  }

  const queue = [startStationId];
  const visited = new Set([startStationId]);
  const prev = {};

  while (queue.length > 0) {
    const currentStationId = queue.shift();
    const station = graph.stations[currentStationId];

    yield {
      type: 'visit',
      algorithm: 'bfs',
      stationId: currentStationId,
      stationName: station.name,
      stationsChecked: visited.size,
      queueSnapshot: queue.slice(0, 5).map(sId => ({
        stationName: graph.stations[sId].name
      })),
      narration: `Checking ${station.name}. Exploring neighboring stations.`
    };

    if (currentStationId === targetStationId) {
      const stationPath = [];
      let curr = targetStationId;
      while (curr) {
        stationPath.unshift(curr);
        curr = prev[curr];
      }

      let totalTime = 0;
      const detailedPath = [];
      for (let i = 0; i < stationPath.length; i++) {
        const sId = stationPath[i];
        if (i === 0) {
          detailedPath.push({ stationId: sId, lineId: null, edgeFromPrev: null });
        } else {
          const prevId = stationPath[i - 1];
          const conn = CONNECTORS.find(
            c => (c.from === prevId && c.to === sId) || (c.from === sId && c.to === prevId)
          );
          if (conn) {
            totalTime += conn.minutes;
            detailedPath.push({
              stationId: sId,
              lineId: null,
              edgeFromPrev: { type: conn.type, minutes: conn.minutes, fromStationId: prevId, toStationId: sId }
            });
          } else {
            const prevStation = graph.stations[prevId];
            const currStation = graph.stations[sId];
            const sharedLine = prevStation.lines.find(l => currStation.lines.includes(l));
            const travelMinutes = sharedLine === 'mrts' ? 3 : 2;
            totalTime += travelMinutes;
            detailedPath.push({
              stationId: sId,
              lineId: sharedLine || null,
              edgeFromPrev: { type: sharedLine === 'mrts' ? 'mrts' : 'metro', minutes: travelMinutes, lineId: sharedLine, fromStationId: prevId, toStationId: sId }
            });
          }
        }
      }

      yield {
        type: 'done',
        algorithm: 'bfs',
        success: true,
        totalTime,
        stationsChecked: visited.size,
        visitedStations: Array.from(visited),
        path: detailedPath,
        stepsText: generateStepInstructions(detailedPath, graph),
        stops: stationPath.length - 1,
        lineChanges: 0
      };
      return;
    }

    for (const neighborId of graph.stationGraph[currentStationId] || []) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        prev[neighborId] = currentStationId;
        queue.push(neighborId);
        yield { type: 'queue', algorithm: 'bfs', fromStationId: currentStationId, toStationId: neighborId };
      }
    }
  }

  yield {
    type: 'done',
    algorithm: 'bfs',
    success: false,
    totalTime: Infinity,
    stationsChecked: visited.size,
    visitedStations: Array.from(visited),
    path: [],
    stepsText: ['No route found.'],
    stops: 0,
    lineChanges: 0
  };
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
export function findRoute(graph, startStationId, targetStationId, algorithmName = 'dijkstra') {
  let gen;
  if (algorithmName === 'astar') gen = astar(graph, startStationId, targetStationId);
  else if (algorithmName === 'bfs') gen = bfs(graph, startStationId, targetStationId);
  else gen = dijkstra(graph, startStationId, targetStationId);
  return runAlgorithm(gen);
}
