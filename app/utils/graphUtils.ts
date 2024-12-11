import { RuleLink } from "@/app/types/rulemap";

type NodeId = number;
type GraphLinks = RuleLink[];
type Direction = "ancestors" | "descendants";

const getConnectedNodes = (
  links: GraphLinks,
  nodeId: NodeId,
  direction: Direction,
  visited = new Set<NodeId>()
): Set<NodeId> => {
  const connected = new Set<NodeId>();
  if (visited.has(nodeId)) return connected;
  visited.add(nodeId);

  links.forEach((link) => {
    const sourceId = (link.source as any).id;
    const targetId = (link.target as any).id;

    const isConnected = direction === "ancestors" ? targetId === nodeId : sourceId === nodeId;
    const nextNode = direction === "ancestors" ? sourceId : targetId;

    if (isConnected) {
      connected.add(nextNode);
      const nextConnected = getConnectedNodes(links, nextNode, direction, visited);
      nextConnected.forEach((id) => connected.add(id));
    }
  });

  return connected;
};

const getConnectedLinks = (links: GraphLinks, nodeId: NodeId, direction: Direction): RuleLink[] => {
  const connected = getConnectedNodes(links, nodeId, direction);

  return links.filter((link) => {
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
};

export const useGraphTraversal = (links: GraphLinks) => {
  const getAllAncestors = (nodeId: NodeId) => getConnectedNodes(links, nodeId, "ancestors");

  const getAllDescendants = (nodeId: NodeId) => getConnectedNodes(links, nodeId, "descendants");

  const getAncestorLinks = (nodeId: NodeId) => getConnectedLinks(links, nodeId, "ancestors");

  const getDescendantLinks = (nodeId: NodeId) => getConnectedLinks(links, nodeId, "descendants");

  return {
    getAllAncestors,
    getAllDescendants,
    getAncestorLinks,
    getDescendantLinks,
  };
};
