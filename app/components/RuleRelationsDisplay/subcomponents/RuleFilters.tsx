import { RuleNode, RuleLink } from "@/app/types/rulemap";
import { GraphTraversal } from "@/app/utils/graphUtils";

export interface RuleFiltersProps {
  nodes: RuleNode[];
  links: RuleLink[];
  searchTerm: string;
  categoryFilter: string;
  showDraftRules: boolean;
}

export class RuleFilters {
  private graphTraversal: GraphTraversal;

  constructor(links: RuleLink[]) {
    this.graphTraversal = new GraphTraversal(links);
  }

  getNodesForCategory(nodes: RuleNode[], category: string, showDraftRules: boolean): Set<number> {
    const matchingNodes = new Set<number>();

    nodes.forEach((node) => {
      if (!showDraftRules && !node.isPublished) return;

      if (!category) {
        matchingNodes.add(node.id);
        return;
      }

      if (node.filepath?.includes(category)) {
        matchingNodes.add(node.id);

        const ancestors = this.graphTraversal.getAllAncestors(node.id);
        const descendants = this.graphTraversal.getAllDescendants(node.id);

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
  }

  isNodeVisible(node: RuleNode, searchPattern: string, visibleNodes: Set<number>, showDraftRules: boolean): boolean {
    return (
      (showDraftRules || (node.isPublished ?? false)) &&
      visibleNodes.has(node.id) &&
      (searchPattern === "" || node.name.toLowerCase().includes(searchPattern))
    );
  }

  isLinkVisible(link: RuleLink, visibleNodes: Set<number>, showDraftRules: boolean): boolean {
    const sourceVisible =
      visibleNodes.has((link.source as any).id) && (showDraftRules || (link.source as any).isPublished);
    const targetVisible =
      visibleNodes.has((link.target as any).id) && (showDraftRules || (link.target as any).isPublished);
    return sourceVisible && targetVisible;
  }
}
