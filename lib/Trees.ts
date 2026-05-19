import { GenericSeq } from "./Generate.ts";
import { Eol, Out, SetItemSeparator } from "./Out.ts";
import { MinMax } from "./Random.ts";

export interface Node<T = any> {
  n: number;
  children: Node[];
  data: T;
}

export interface TreeGenParams {
  startNum: number;
  numNodes: number;
}

export class TreeGenState implements TreeGenParams {
  startNum: number;
  numNodes: number;

  data?: any[];
  state?: Record<string, any>;
  nextNum?: number;

  constructor(init: TreeGenParams) {
    this.startNum = init.startNum;
    this.numNodes = init.numNodes;
    this.state = {};
    this.nextNum = this.startNum;
  }

  getDepthState(key: number) {
    if (!this.state[key]) {
      this.state[key] = key > 0 ? { ...this.state[key - 1] } : {};
    }
    return this.state[key];
  }

  getState(key: string, prevKey?: string) {
    if (!this.state[key]) {
      this.state[key] =
        prevKey && this.state[prevKey] ? { ...this.state[prevKey] } : {};
    }
    return this.state[key];
  }
}

export type NodeGen<T> = (
  parent: Node | null,
  depth: number,
  params: TreeGenState,
) => T | null;

function doGenTreeDepth<T>(
  current: Node,
  p: NodeGen<T>,
  depth: number,
  params: TreeGenState,
) {
  let nodeData: T | null = null;
  while (null != (nodeData = p(current, depth, params))) {
    const node = {
      n: params.nextNum,
      children: [],
      data: nodeData,
    };
    current.children.push(node);
    params.nextNum++;
    doGenTreeDepth(node, p, depth + 1, params);
  }
}

function doGenTreeBreadth<T>(
  current: Node,
  p: NodeGen<T>,
  depth: number,
  params: TreeGenState,
) {
  let nodeData: T | null = null;
  while (null != (nodeData = p(current, depth, params))) {
    const node = {
      n: params.nextNum,
      children: [],
      data: nodeData,
    };
    current.children.push(node);
    params.nextNum++;
  }
  for (const child of current.children) {
    doGenTreeBreadth(child, p, depth + 1, params);
  }
}

export function GenTreeDepth<T>(p: NodeGen<T>, params: TreeGenParams): Node<T> {
  let depth = 0;
  const state = new TreeGenState(params);
  const root = {
    n: state.startNum,
    children: [],
    data: p(null, depth, state),
  };
  state.nextNum++;
  doGenTreeDepth(root, p, depth + 1, state);
  return root;
}

export function GenTreeBreadth<T>(
  p: NodeGen<T>,
  params: TreeGenParams,
): Node<T> {
  let depth = 0;
  const state = new TreeGenState(params);
  const root = {
    n: params.startNum,
    children: [],
    data: p(null, depth, state),
  };
  doGenTreeBreadth(root, p, depth + 1, state);
  return root;
}

export function BinaryTreeGen<T>(p: NodeGen<T>): NodeGen<T> {
  return (parent: Node | null, depth: number, params: TreeGenState) => {
    if (parent?.children.length >= 2) {
      return null;
    }
    if (params.nextNum - params.startNum >= params.numNodes) {
      return null;
    }
    return p(parent, depth, params);
  };
}

export function DfsFlattenTree(current: Node, nodes: Node[]): Node[] {
  nodes.push(current);
  for (const n of current.children) {
    DfsFlattenTree(n, nodes);
  }
  return nodes;
}

export function OutputTreeChildrenBinary(root: Node) {
  const nodes = DfsFlattenTree(root, []).sort((a, b) => a.n - b.n);
  for (const node of nodes) {
    const l = node.children[0]?.n ?? 0;
    const r = node.children[1]?.n ?? 0;
    Out(`${l} ${r}`);
    Eol();
  }
}
export interface Edge {
  u: number;
  v: number;
}
function doDfsForEdges<T>(root: Node<T>, edges: Edge[]) {
  for (const e of root.children) {
    edges.push({ u: root.n, v: e.n });
    doDfsForEdges(e, edges);
  }
  return edges;
}
function doDfsForParents<T>(root: Node<T>, parents: number[]) {
  for (const e of root.children) {
    parents[e.n] = root.n;
    doDfsForParents(e, parents);
  }
  return parents;
}
export function OutputTreeEdges<T>(root: Node) {
  let edges = doDfsForEdges<T>(root, []);
  console.log(edges);
  for (const { u, v } of edges) {
    Out(`${u} ${v}`);
    Eol();
  }
}
export function OutputTreeParents<T>(root: Node) {
  let Parents = doDfsForParents<T>(root, []);
  // console.log(Parents);
  for (const u of Parents) {
    if (u) Out(`${u}`);
  }
  Eol();
}
export function OutputTreeParentsCheapWay(n: number) {
  SetItemSeparator(" ");
  console.log("ST")
  GenericSeq(n - 1, (i) => MinMax(1, i+1));
}
