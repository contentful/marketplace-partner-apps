import { describe, it, expect, vi } from "vitest";

import { getEntitreeLayout } from "../getEntitreeLayout";
import { Position } from "@xyflow/react";

vi.mock("entitree-flex", () => {
  return {
    layoutFromMap: (_rootId: string, _tree: any, _opts: any) => {
      return {
        nodes: [
          { id: "root", name: "Root", x: 0, y: 0 },
          { id: "child", name: "Child", x: 100, y: 100, parents: ["root"] },
        ],
        rels: [{ source: { id: "root" }, target: { id: "child" } }],
      };
    },
  };
});

describe("getEntitreeLayout", () => {
  it("maps entitree nodes & edges into React-Flow compatible structures", () => {
    const tree = {
      root: { id: "root", name: "Root", children: ["child"] },
      child: { id: "child", name: "Child", parents: ["root"], children: [] },
    } as any;

    const { nodes, edges } = getEntitreeLayout(tree, "TB", "root");

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    const rootNode = nodes.find((n: any) => n.id === "root") as any;
    expect(rootNode).toBeDefined();
    expect(rootNode.position).toEqual({ x: 0, y: 0 });
    expect(rootNode.data.isRoot).toBe(true);
    expect(rootNode.sourcePosition).toBe(Position.Bottom);
    expect(rootNode.targetPosition).toBe(Position.Top);

    expect(edges[0].id).toBe("root->child");
  });
});
