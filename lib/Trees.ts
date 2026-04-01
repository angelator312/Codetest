import { Eol, Out } from "./Out.ts";

export interface Node<T = any> {
  n: number;
  children: Node[];
  data: T;
}

export interface TreeGenParams {
  data?: any[];
  startNum: number;
  nextNum?: number;
  numNodes: number;
}

export type NodeGen<T> = (
  parent: Node | null,
  depth: number,
  params: TreeGenParams,
) => T | null;

function doGenTreeDepth<T>(
  current: Node,
  p: NodeGen<T>,
  depth: number,
  params: TreeGenParams,
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
  params: TreeGenParams,
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
  const root = {
    n: params.startNum,
    children: [],
    data: p(null, depth, params),
  };
  params.nextNum = params.startNum + 1;
  doGenTreeDepth(root, p, depth + 1, params);
  return root;
}

export function GenTreeBreadth<T>(
  p: NodeGen<T>,
  params: TreeGenParams,
): Node<T> {
  let depth = 0;
  params.nextNum = params.startNum + 1;
  const root = {
    n: params.startNum,
    children: [],
    data: p(null, depth, params),
  };
  doGenTreeBreadth(root, p, depth + 1, params);
  return root;
}

export function BinaryTreeGen<T>(p: NodeGen<T>): NodeGen<T> {
  return (parent: Node | null, depth: number, params: TreeGenParams) => {
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
export function OutputTreeEdges<T>(root: Node) {
  let edges = doDfsForEdges<T>(root, []);
  console.log(edges);
  for (const { u, v } of edges) {
    Out(`${u} ${v}`);
    Eol();
  }
}
