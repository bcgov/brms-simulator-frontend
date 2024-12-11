import { RuleNode, RuleLink } from "@/app/types/rulemap";
import { useGraphTraversal } from "@/app/utils/graphUtils";

export interface RuleFiltersProps {
  nodes: RuleNode[];
  links: RuleLink[];
  searchTerm: string;
  categoryFilter: string;
  showDraftRules: boolean;
}

// Returns nodes for a specific category
// If category is empty, returns all nodes
// If showDraftRules is false, only returns published nodes
// Also returns all ancestors and descendants of the matching nodes
export const getNodesForCategory = (
  nodes: RuleNode[],
  links: RuleLink[],
  category: string,
  showDraftRules: boolean
): Set<number> => {
  const { getAllAncestors, getAllDescendants } = useGraphTraversal(links);
  const matchingNodes = new Set<number>();

  nodes.forEach((node) => {
    if (!showDraftRules && !node.isPublished) return;

    if (!category) {
      matchingNodes.add(node.id);
      return;
    }

    if (node.filepath?.includes(category)) {
      matchingNodes.add(node.id);

      const ancestors = getAllAncestors(node.id);
      const descendants = getAllDescendants(node.id);

      ancestors.forEach((id) => {
        const ancestorNode = nodes.find((n) => n.id === id);
        if (ancestorNode && (showDraftRules || ancestorNode.isPublished)) {
          matchingNodes.add(id);
        }
      });

      descendants.forEach((id) => {
        const descendantNode = nodes.find((n) => n.id === id);
        if (descendantNode && (showDraftRules || descendantNode.isPublished)) {
          matchingNodes.add(id);
        }
      });
    }
  });

  return matchingNodes;
};

// Returns links that connect nodes in the visible set
// If showDraftRules is false, only returns links between published nodes
// Also returns links that connect ancestors and descendants of the visible nodes
// This is used to highlight connections when a node is selected
export const isNodeVisible = (
  node: RuleNode,
  searchPattern: string,
  visibleNodes: Set<number>,
  showDraftRules: boolean
): boolean => {
  return (
    (showDraftRules || (node.isPublished ?? false)) &&
    visibleNodes.has(node.id) &&
    (searchPattern === "" || node.name.toLowerCase().includes(searchPattern))
  );
};

// Returns links that connect nodes in the visible set
export const isLinkVisible = (link: RuleLink, visibleNodes: Set<number>, showDraftRules: boolean): boolean => {
  const sourceVisible =
    visibleNodes.has((link.source as any).id) && (showDraftRules || (link.source as any).isPublished);
  const targetVisible =
    visibleNodes.has((link.target as any).id) && (showDraftRules || (link.target as any).isPublished);
  return sourceVisible && targetVisible;
};
