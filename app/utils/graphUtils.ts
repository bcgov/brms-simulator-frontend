import { RuleLink } from "@/app/types/rulemap";

type NodeId = number;
type GraphLinks = RuleLink[];
type Direction = "ancestors" | "descendants";

export class GraphTraversal {
  private links: GraphLinks;

  constructor(links: GraphLinks) {
    this.links = links;
  }

  private getConnectedNodes(nodeId: NodeId, direction: Direction, visited = new Set<NodeId>()): Set<NodeId> {
    const connected = new Set<NodeId>();
    if (visited.has(nodeId)) return connected;
    visited.add(nodeId);

    this.links.forEach((link) => {
      const sourceId = (link.source as any).id;
      const targetId = (link.target as any).id;

      const isConnected = direction === "ancestors" ? targetId === nodeId : sourceId === nodeId;

      const nextNode = direction === "ancestors" ? sourceId : targetId;

      if (isConnected) {
        connected.add(nextNode);
        const nextConnected = this.getConnectedNodes(nextNode, direction, visited);
        nextConnected.forEach((id) => connected.add(id));
      }
    });

    return connected;
  }

  private getConnectedLinks(nodeId: NodeId, direction: Direction): RuleLink[] {
    const connected = this.getConnectedNodes(nodeId, direction);

    return this.links.filter((link) => {
      const sourceId = (link.source as any).id;
      const targetId = (link.target as any).id;

      if (direction === "ancestors") {
        return (
          (connected.has(sourceId) && connected.has(targetId)) ||
          (connected.has(sourceId) && targetId === nodeId) ||
          targetId === nodeId
        );
      } else {
        return (
          (connected.has(sourceId) && connected.has(targetId)) ||
          (connected.has(targetId) && sourceId === nodeId) ||
          sourceId === nodeId
        );
      }
    });
  }

  public getAllAncestors(nodeId: NodeId): Set<NodeId> {
    return this.getConnectedNodes(nodeId, "ancestors");
  }

  public getAllDescendants(nodeId: NodeId): Set<NodeId> {
    return this.getConnectedNodes(nodeId, "descendants");
  }

  public getAncestorLinks(nodeId: NodeId): RuleLink[] {
    return this.getConnectedLinks(nodeId, "ancestors");
  }

  public getDescendantLinks(nodeId: NodeId): RuleLink[] {
    return this.getConnectedLinks(nodeId, "descendants");
  }
}
