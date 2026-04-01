/// <reference path="../../types/index.d.ts" />
SetOutput("test.in");
SetCpp("e.cpp", "e.cpp");

type W ={  };


while (NextCase()) {
  if (N as number % 2 == 0) {
    continue;
  }
  Int(1); Eol();
  Int(N); Eol();
  const t = GenTreeBreadth<W>(BinaryTreeGen<W>((parent: Node<W>| null, nodeNum: number, depth: number, params:TreeGenParams) => {
    return {};
  }), { numNodes: Number(N), startNum: 1 });
  OutputTreeChildrenBinary(t);
  Test();
}
