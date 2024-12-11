import { useEffect, RefObject } from "react";
import * as d3 from "d3";
import { RuleMapRule, RuleNode, RuleLink } from "@/app/types/rulemap";
import { useGraphTraversal } from "@/app/utils/graphUtils";
import { getNodesForCategory, isNodeVisible, isLinkVisible } from "../subcomponents/RuleFilters";
import { GraphNavigation } from "../subcomponents/GraphNavigation";
import { RuleNodesGroup } from "../subcomponents/RuleNodesGroup";
import { useRuleModal } from "../contexts/RuleModalContext";

interface UseRuleGraphProps {
  rules: RuleMapRule[];
  svgRef: RefObject<SVGSVGElement>;
  dimensions: { width: number; height: number };
  searchTerm: string;
  categoryFilter: string;
  showDraftRules: boolean;
}

export const useRuleGraph = ({
  rules,
  svgRef,
  dimensions,
  searchTerm,
  categoryFilter,
  showDraftRules,
}: UseRuleGraphProps) => {
  const { openModal } = useRuleModal();

  useEffect(
    () => {
      if (!svgRef.current || !rules.length) return;

      const { width, height } = dimensions;

      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("role", "img")
        .attr("aria-label", "Rule relationships diagram")
        .attr("tabindex", "0");

      // Add zoom
      const containerGroup = svg.append("g");
      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          containerGroup.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      // Add navigation controls
      GraphNavigation(svg, containerGroup, zoom);

      const uniqueRules = new Map<number, RuleMapRule>();
      rules.forEach((rule) => {
        if (!uniqueRules.has(rule.id)) {
          uniqueRules.set(rule.id, rule);
        }
      });

      const nodes: RuleNode[] = Array.from(uniqueRules.values()).map((rule) => ({
        id: rule.id,
        name: rule.name || "N/A",
        label: rule.label ?? rule.name,
        radius: 8,
        description: rule?.description || null,
        url: rule?.url,
        filepath: rule?.filepath,
        isPublished: rule?.isPublished,
        reviewBranch: rule?.reviewBranch,
      }));

      // Create links only between existing nodes
      const links: RuleLink[] = Array.from(uniqueRules.values()).flatMap((rule) => {
        const parentLinks =
          rule.parent_rules
            ?.filter((parent) => uniqueRules.has(parent.id))
            .map((parent) => ({
              source: parent.id,
              target: rule.id,
            })) || [];

        const childLinks =
          rule.child_rules
            ?.filter((child) => uniqueRules.has(child.id))
            .map((child) => ({
              source: rule.id,
              target: child.id,
            })) || [];

        return [...parentLinks, ...childLinks];
      });

      nodes.sort((a, b) => a.id - b.id);

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(150)
            .strength(0.5)
        )
        .force("charge", d3.forceManyBody().strength(-500).distanceMax(500))
        .force("x", d3.forceX().strength(0.03))
        .force("y", d3.forceY().strength(0.03))
        .force("collision", d3.forceCollide().radius(60));

      // Draw links
      const link = containerGroup
        .append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("marker-end", "url(#arrow)");

      // Add arrow marker
      containerGroup
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#999")
        .attr("d", "M0,-5L10,0L0,5");

      const { getAllAncestors, getDescendantLinks, getAncestorLinks, getAllDescendants } = useGraphTraversal(links);

      const highlightConnections = (nodeId: number | null) => {
        if (nodeId === null) {
          highlightSearch(searchTerm);
          link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");
          return;
        }

        const ancestors = getAllAncestors(nodeId);
        const descendants = getAllDescendants(nodeId);
        const ancestorLinks = getAncestorLinks(nodeId);
        const descendantLinks = getDescendantLinks(nodeId);

        ruleNodes
          .getSelection()
          .selectAll("circle")
          .attr("fill", (d: any) => {
            if (d.id === nodeId) return "#ff7f50";
            if (ancestors.has(d.id)) return "#4169e1";
            if (descendants.has(d.id)) return "#32cd32";
            return "#69b3a2";
          });

        ruleNodes
          .getSelection()
          .selectAll("text")
          .style("font-weight", (d: any) =>
            d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? "bold" : "normal"
          );

        link
          .attr("stroke", (line: any) => {
            if (ancestorLinks.includes(line)) return "#4169e1";
            if (descendantLinks.includes(line)) return "#32cd32";
            return "#999";
          })
          .attr("stroke-opacity", (line: any) =>
            ancestorLinks.includes(line) || descendantLinks.includes(line) ? 1 : 0.2
          )
          .attr("stroke-width", (line: any) =>
            ancestorLinks.includes(line) || descendantLinks.includes(line) ? "2" : "1"
          );

        ruleNodes
          .getSelection()
          .style("opacity", (d: any) => (d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? 1 : 0.3));
      };

      const highlightSearch = (term: string) => {
        const searchPattern = term.toLowerCase();
        const visibleNodes = getNodesForCategory(nodes, links, categoryFilter, showDraftRules);

        ruleNodes.getSelection().each(function (d: any) {
          const node = d3.select(this);
          const nodeIsVisible = isNodeVisible(d, searchPattern, visibleNodes, showDraftRules);
          const isDraftVisible = showDraftRules || d.isPublished;

          // Handle draft visibility with display
          node.style("display", isDraftVisible ? "" : "none");

          // Handle search/filter visibility with opacity
          if (isDraftVisible) {
            node.select("circle").attr("fill", d.name.toLowerCase().includes(searchPattern) ? "#ff7f50" : "#69b3a2");
            node.select("text").style("font-weight", d.name.toLowerCase().includes(searchPattern) ? "bold" : "normal");
            node.style("opacity", nodeIsVisible ? 1 : 0.2);
          }
        });

        link.each(function (d: any) {
          const linkElement = d3.select(this);
          const isVisible = isLinkVisible(d, visibleNodes, showDraftRules);

          linkElement.style("display", isVisible ? "" : "none").style("opacity", 0.6);
        });
      };

      const handleSearch = () => {
        highlightSearch(searchTerm);
      };

      // Create RuleNodesGroup with filtered nodes
      const ruleNodes = RuleNodesGroup({
        containerGroup,
        nodes,
        simulation,
        highlightConnections,
        highlightSearch,
        searchTerm,
        openModal,
      });

      // Initial search highlight
      handleSearch();

      // Reset on background click
      svg.on("click", () => {
        // Reset link styles to base rendering
        link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");

        highlightSearch(searchTerm);
      });

      svg.on("keydown", (event) => {
        switch (event.key) {
          case "Escape":
            link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");
            highlightSearch(searchTerm);
            break;
          case "ArrowUp":
            svg.transition().call(zoom.translateBy as any, 0, -30);
            break;
          case "ArrowDown":
            svg.transition().call(zoom.translateBy as any, 0, 30);
            break;
          case "ArrowLeft":
            svg.transition().call(zoom.translateBy as any, -30, 0);
            break;
          case "ArrowRight":
            svg.transition().call(zoom.translateBy as any, 30, 0);
            break;
          case "+":
            svg.transition().call(zoom.scaleBy as any, 1.2);
            break;
          case "-":
            svg.transition().call(zoom.scaleBy as any, 0.8);
            break;
        }
      });

      // Update positions on simulation tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => (d.source as any).x)
          .attr("y1", (d) => (d.source as any).y)
          .attr("x2", (d) => (d.target as any).x)
          .attr("y2", (d) => (d.target as any).y);

        ruleNodes.updatePositions();
      });

      return () => {
        simulation.stop();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, dimensions, searchTerm, categoryFilter, showDraftRules]
  );
};
