import * as d3 from "d3";
import { RuleNode } from "@/app/types/rulemap";
import { RuleDescriptionBox } from "./RuleDescriptionBox";

export class RuleNodesGroup {
  private nodeGroup: d3.Selection<any, any, any, any>;
  private descriptionBox: RuleDescriptionBox;
  private simulation: d3.Simulation<any, undefined>;
  private highlightConnections: (nodeId: number | null) => void;

  constructor({
    containerGroup,
    nodes,
    simulation,
    highlightConnections,
    highlightSearch,
    searchTerm,
  }: {
    containerGroup: d3.Selection<any, any, any, any>;
    nodes: RuleNode[];
    simulation: d3.Simulation<any, undefined>;
    highlightConnections: (nodeId: number | null) => void;
    highlightSearch: (term: string) => void;
    searchTerm: string;
  }) {
    this.simulation = simulation;
    this.highlightConnections = highlightConnections;

    this.nodeGroup = this.createNodeGroup(containerGroup, nodes);
    this.descriptionBox = new RuleDescriptionBox({
      containerGroup,
      nodeGroup: this.nodeGroup,
    });

    this.setupEventListeners(highlightSearch, searchTerm);
  }

  private createNodeGroup(containerGroup: d3.Selection<any, any, any, any>, nodes: RuleNode[]) {
    const nodeGroup = containerGroup
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-label", (d) => `Rule: ${d.name}`)
      .call(
        d3
          .drag<any, any>()
          .on("start", (event) => this.dragstarted(event))
          .on("drag", (event) => this.dragged(event))
          .on("end", (event) => this.dragended(event))
      );

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
  }

  private setupEventListeners(highlightSearch: (term: string) => void, searchTerm: string) {
    // Add hover effects
    this.nodeGroup
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

    // Click handlers
    this.nodeGroup.on("click", (event, d: any) => {
      event.stopPropagation();
      this.highlightConnections(d.id);
    });

    this.nodeGroup.selectAll("text").on("click", (event: MouseEvent, d: any) => {
      event.stopPropagation();
      this.descriptionBox.show(d);
      this.highlightConnections(d.id);
    });

    // Keyboard navigation
    this.nodeGroup.on("keydown", (event, d: any) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        this.descriptionBox.hide();
        highlightSearch(searchTerm);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const isCurrentlyShown = this.descriptionBox.isVisible();

        if (isCurrentlyShown) {
          this.descriptionBox.hide();
        } else {
          this.descriptionBox.show(d);
          this.highlightConnections(d.id);
        }
      }
    });
  }

  private dragstarted(event: any) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  private dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  private dragended(event: any) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  public updatePositions() {
    this.nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  public getSelection() {
    return this.nodeGroup;
  }

  public hideDescriptionBox() {
    this.descriptionBox.hide();
  }
}
