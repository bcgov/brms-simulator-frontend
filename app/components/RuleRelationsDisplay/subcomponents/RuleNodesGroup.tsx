import * as d3 from "d3";
import { RuleNode } from "@/app/types/rulemap";
import { RuleDescriptionBox } from "./RuleDescriptionBox";

type RuleNodesGroupProps = {
  containerGroup: d3.Selection<any, any, any, any>;
  nodes: RuleNode[];
  simulation: d3.Simulation<any, undefined>;
  highlightConnections: (nodeId: number | null) => void;
  highlightSearch: (term: string) => void;
  searchTerm: string;
};

// Creates a group of nodes for the rule graph
// Each node is a circle with a label, connected to other nodes via links
// Nodes are draggable, and clickable
export const RuleNodesGroup = ({
  containerGroup,
  nodes,
  simulation,
  highlightConnections,
  highlightSearch,
  searchTerm,
}: RuleNodesGroupProps) => {
  const dragstarted = (event: any) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  };

  const dragged = (event: any) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragended = (event: any) => {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  };

  const createNodeGroup = () => {
    const nodeGroup = containerGroup
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-label", (d) => `Rule: ${d.name}`)
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    // Add circles
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "#69b3a2");

    // Add labels
    nodeGroup
      .append("text")
      .text((d) => d.label || d.name)
      .attr("font-size", "12px")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("cursor", "pointer")
      .attr("role", "link")
      .style("text-decoration", "underline")
      .style("fill", "#0066cc")
      .style("font-weight", "500")
      .style("text-shadow", "0 0 3px white")
      .on("mouseover", function () {
        d3.select(this).style("fill", "#003366");
      })
      .on("mouseout", function () {
        d3.select(this).style("fill", "#0066cc");
      });

    return nodeGroup;
  };

  const nodeGroup = createNodeGroup();
  const descriptionBox = new RuleDescriptionBox({
    containerGroup,
    nodeGroup,
  });

  // Add event listeners for interacting with nodes
  nodeGroup
    .select("circle")
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", (d: any) => d.radius * 1.2);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", (d: any) => d.radius);
    });

  nodeGroup.on("click", (event, d: any) => {
    event.stopPropagation();
    highlightConnections(d.id);
  });

  nodeGroup.selectAll("text").on("click", (event: MouseEvent, d: any) => {
    event.stopPropagation();
    descriptionBox.show(d);
    highlightConnections(d.id);
  });

  nodeGroup.on("keydown", (event, d: any) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      descriptionBox.hide();
      highlightSearch(searchTerm);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const isCurrentlyShown = descriptionBox.isVisible();

      if (isCurrentlyShown) {
        descriptionBox.hide();
      } else {
        descriptionBox.show(d);
        highlightConnections(d.id);
      }
    }
  });

  return {
    updatePositions: () => {
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    },
    getSelection: () => nodeGroup,
    hideDescriptionBox: () => {
      descriptionBox.hide();
    },
  };
};
