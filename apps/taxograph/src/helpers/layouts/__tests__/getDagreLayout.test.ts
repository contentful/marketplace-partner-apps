import { describe, it, expect } from "vitest";

import { getDagreLayout } from "../getDagreLayout";
import { FlowDirection } from "../../../types/Flow";

import type { Node, Edge } from "@xyflow/react";

describe("getDagreLayout", () => {
  it("adds position and direction data to nodes", () => {
    const nodes: Node[] = [
      {
        id: "root",
        data: { label: "Root", parents: [] },
        position: { x: 0, y: 0 },
        hidden: false,
        type: "treeNode",
      } as any,
      {
        id: "child",
        data: { label: "Child", parents: ["root"] },
        position: { x: 0, y: 0 },
        hidden: false,
        type: "treeNode",
      } as any,
    ];

    const edges: Edge[] = [
      {
        id: "root->child",
        source: "root",
        target: "child",
        type: "step",
        animated: false,
        hidden: false,
      },
    ];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getDagreLayout(
      nodes,
      edges,
      FlowDirection.TB
    );

    expect(layoutedNodes).toHaveLength(nodes.length);
    expect(layoutedEdges).toEqual(edges);

    layoutedNodes.forEach((n) => {
      expect(n.data.direction).toBe(FlowDirection.TB);
      expect(typeof n.position.x).toBe("number");
      expect(typeof n.position.y).toBe("number");
    });
  });
});
