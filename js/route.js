// Route formatting and path reconstruction utilities

function getLineName(lineId) {
  if (lineId === 'blue') return 'Blue Line';
  if (lineId === 'green') return 'Green Line';
  if (lineId === 'mrts') return 'MRTS';
  return lineId || 'Transit';
}

// Generate human-friendly step instructions from a line-node path
export function generateStepInstructions(path, graph) {
  if (!path || path.length === 0) return ['No route found.'];
  if (path.length === 1) return ['Start and destination are the same station.'];

  const instructions = [];
  let currentMode = null;
  let currentLineId = null;

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    const edge = next.edgeFromPrev;
    if (!edge) continue;

    if (edge.type === 'transfer') {
      const stationName = graph.stations[current.stationId].name;
      const toLineName = getLineName(next.lineId);
      instructions.push(`Change at ${stationName} to ${toLineName}.`);
      currentMode = 'line';
      currentLineId = next.lineId;
    } else if (edge.type === 'walk' || edge.type === 'bus') {
      const fromName = graph.stations[current.stationId].name;
      const toName = graph.stations[next.stationId].name;
      const action = edge.type === 'walk' ? 'Walk' : 'Take bus';
      instructions.push(`${action} from ${fromName} to ${toName} (about ${edge.minutes} min).`);
      currentMode = 'connector';
      currentLineId = null;
    } else {
      if (currentMode !== 'line' || currentLineId !== edge.lineId) {
        currentMode = 'line';
        currentLineId = edge.lineId;
        const lineName = getLineName(edge.lineId);
        const startName = graph.stations[current.stationId].name;

        let segmentEnd = next.stationId;
        for (let j = i + 1; j < path.length - 1; j++) {
          const aheadEdge = path[j + 1].edgeFromPrev;
          if (aheadEdge && aheadEdge.lineId === edge.lineId) {
            segmentEnd = path[j + 1].stationId;
          } else {
            break;
          }
        }
        instructions.push(`Board ${lineName} at ${startName} towards ${graph.stations[segmentEnd].name}.`);
      }
    }
  }

  const lastStation = path[path.length - 1];
  instructions.push(`Get off at ${graph.stations[lastStation.stationId].name}.`);
  return instructions;
}

// Reconstruct path from line-node graph prev map
export function reconstructPath(endNodeId, prev, graph) {
  const path = [];
  let curr = endNodeId;

  while (curr) {
    const node = graph.lineNodes[curr];
    const prevInfo = prev[curr];
    path.unshift({
      nodeId: node.id,
      stationId: node.stationId,
      lineId: node.lineId,
      edgeFromPrev: prevInfo ? prevInfo.edge : null
    });
    curr = prevInfo ? prevInfo.fromNodeId : null;
  }

  let lineChanges = 0;
  let stops = 0;
  for (let i = 1; i < path.length; i++) {
    if (path[i].edgeFromPrev?.type === 'transfer') lineChanges++;
    if (path[i].stationId !== path[i - 1].stationId) stops++;
  }

  return { path, lineChanges, stops };
}
