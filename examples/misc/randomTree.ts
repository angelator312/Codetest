/// <reference path="../../types/index.d.ts" />

import { deprecate, parseArgs } from "util";

type Dat ={ v: number, childrenSum: number };


// Generate Tree where sum of siblings is always 10, 20, or 30;
const t = GenTreeBreadth<Dat>((parent, depth, params) => {
  // Assign -1 to the root node
  if (parent == null) {
    return { v: -1, childrenSum: Choice(10, 20, 30) };
  }

  if ((params.nextNum as number) - params.startNum >= params.numNodes) {
    return null;
  }

  const state = params.getDepthState(depth);

  // init max sum for the current node
  if (!state.sum || state.depth != depth) {
    state.sum = 0;
    state.depth = depth;
  }

  // If we reached already the sum no more siblings
  if (state.sum >= parent.data.childrenSum) {
    return null;
  }

  let v = MinMax(1, 10);
  while (state.sum + v > state.maxSum) {
    v = MinMax(1, 10);
  }
  state.sum += v;
  return {
    v,
    childrenSum: Choice(0, 10, 20, 30),
  }
}, { numNodes: Number(N), startNum: 1 });

DirLog(t);
