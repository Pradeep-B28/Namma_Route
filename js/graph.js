// Graph construction for Namma Route
// Builds both:
// 1. Line-node graph (61 nodes) for Dijkstra and A*
// 2. Station-level graph (59 nodes) for BFS

import { STATIONS, LINES, INTERCHANGE_TRANSFER_TIME, CONNECTORS } from './data.js';

// Calculate Euclidean distance between two points
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Build and return the network graphs
export function buildGraph() {
  const stationMap = {};
  const lineNodes = {};
  const stationGraph = {}; // For BFS: stationId -> Set of neighbor stationIds
  const edges = [];

  // 1. Initialize station map
  for (const [id, s] of Object.entries(STATIONS)) {
    stationMap[id] = {
      ...s,
      lines: [],
      lineNodeIds: []
    };
    stationGraph[id] = new Set();
  }

  // 2. Create line nodes for each line and connect consecutive stations
  for (const line of Object.values(LINES)) {
    const stationIds = line.stations;

    for (let i = 0; i < stationIds.length; i++) {
      const sId = stationIds[i];
      const station = stationMap[sId];
      if (!station) {
        throw new Error(`Station not found: ${sId}`);
      }

      if (!station.lines.includes(line.id)) {
        station.lines.push(line.id);
      }

      const lineNodeId = `${sId}_${line.id}`;
      if (!station.lineNodeIds.includes(lineNodeId)) {
        station.lineNodeIds.push(lineNodeId);
      }

      if (!lineNodes[lineNodeId]) {
        lineNodes[lineNodeId] = {
          id: lineNodeId,
          stationId: sId,
          lineId: line.id,
          stationName: station.name,
          x: station.x,
          y: station.y,
          neighbors: []
        };
      }

      // Add edge to previous station on this line
      if (i > 0) {
        const prevStationId = stationIds[i - 1];
        const prevLineNodeId = `${prevStationId}_${line.id}`;
        const travelTime = line.travelTime;
        const dist = distance(station.x, station.y, stationMap[prevStationId].x, stationMap[prevStationId].y);

        // Forward edge
        const edgeForward = {
          from: prevLineNodeId,
          to: lineNodeId,
          fromStationId: prevStationId,
          toStationId: sId,
          minutes: travelTime,
          type: line.id === 'mrts' ? 'mrts' : 'metro',
          lineId: line.id,
          distance: dist
        };
        lineNodes[prevLineNodeId].neighbors.push(edgeForward);
        edges.push(edgeForward);

        // Backward edge
        const edgeBackward = {
          from: lineNodeId,
          to: prevLineNodeId,
          fromStationId: sId,
          toStationId: prevStationId,
          minutes: travelTime,
          type: line.id === 'mrts' ? 'mrts' : 'metro',
          lineId: line.id,
          distance: dist
        };
        lineNodes[lineNodeId].neighbors.push(edgeBackward);
        edges.push(edgeBackward);

        // Add to station-level graph for BFS
        stationGraph[sId].add(prevStationId);
        stationGraph[prevStationId].add(sId);
      }
    }
  }

  // Mark interchanges (stations on multiple lines)
  for (const station of Object.values(stationMap)) {
    station.isInterchange = station.lines.length > 1;
  }

  // 3. Add interchange transfer edges between line nodes at the same station
  for (const station of Object.values(stationMap)) {
    if (station.lineNodeIds.length > 1) {
      for (let i = 0; i < station.lineNodeIds.length; i++) {
        for (let j = i + 1; j < station.lineNodeIds.length; j++) {
          const nodeA = station.lineNodeIds[i];
          const nodeB = station.lineNodeIds[j];

          const edgeAB = {
            from: nodeA,
            to: nodeB,
            fromStationId: station.id,
            toStationId: station.id,
            minutes: INTERCHANGE_TRANSFER_TIME,
            type: 'transfer',
            lineId: null,
            distance: 0
          };
          lineNodes[nodeA].neighbors.push(edgeAB);
          edges.push(edgeAB);

          const edgeBA = {
            from: nodeB,
            to: nodeA,
            fromStationId: station.id,
            toStationId: station.id,
            minutes: INTERCHANGE_TRANSFER_TIME,
            type: 'transfer',
            lineId: null,
            distance: 0
          };
          lineNodes[nodeB].neighbors.push(edgeBA);
          edges.push(edgeBA);
        }
      }
    }
  }

  // 4. Add connector links (walk/bus) to every line node of each connected station
  for (const conn of CONNECTORS) {
    const fromStation = stationMap[conn.from];
    const toStation = stationMap[conn.to];
    if (!fromStation || !toStation) {
      throw new Error(`Connector station not found: ${conn.from} or ${conn.to}`);
    }

    const dist = distance(fromStation.x, fromStation.y, toStation.x, toStation.y);

    // Join to every line node of each station
    for (const fromNodeId of fromStation.lineNodeIds) {
      for (const toNodeId of toStation.lineNodeIds) {
        const edgeForward = {
          from: fromNodeId,
          to: toNodeId,
          fromStationId: fromStation.id,
          toStationId: toStation.id,
          minutes: conn.minutes,
          type: conn.type,
          lineId: null,
          distance: dist
        };
        lineNodes[fromNodeId].neighbors.push(edgeForward);
        edges.push(edgeForward);

        const edgeBackward = {
          from: toNodeId,
          to: fromNodeId,
          fromStationId: toStation.id,
          toStationId: fromStation.id,
          minutes: conn.minutes,
          type: conn.type,
          lineId: null,
          distance: dist
        };
        lineNodes[toNodeId].neighbors.push(edgeBackward);
        edges.push(edgeBackward);
      }
    }

    // Add to station-level graph for BFS
    stationGraph[fromStation.id].add(toStation.id);
    stationGraph[toStation.id].add(fromStation.id);
  }

  // Convert stationGraph Sets to Arrays
  const stationAdjacency = {};
  for (const [sId, set] of Object.entries(stationGraph)) {
    stationAdjacency[sId] = Array.from(set);
  }

  // 5. Compute k for A* heuristic
  // k is the smallest value of (minutes / distance) across all edges with distance > 0
  let minRatio = Infinity;
  for (const edge of edges) {
    if (edge.distance > 0) {
      const ratio = edge.minutes / edge.distance;
      if (ratio < minRatio) {
        minRatio = ratio;
      }
    }
  }

  const k = minRatio;

  // Heuristic function for A* (admissible and consistent)
  const heuristic = (stationAId, stationBId) => {
    const a = stationMap[stationAId];
    const b = stationMap[stationBId];
    if (!a || !b) return 0;
    const d = distance(a.x, a.y, b.x, b.y);
    return k * d;
  };

  return {
    stations: stationMap,
    lineNodes,
    stationGraph: stationAdjacency,
    edges,
    k,
    heuristic,
    stationCount: Object.keys(stationMap).length,
    lineNodeCount: Object.keys(lineNodes).length,
    directedEdgeCount: edges.length,
    undirectedEdgeCount: edges.length / 2
  };
}
