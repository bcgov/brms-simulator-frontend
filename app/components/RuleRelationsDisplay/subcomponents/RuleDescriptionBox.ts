import { message } from "antd";
import * as d3 from "d3";

export interface RuleDescriptionBoxProps {
  containerGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodeGroup: d3.Selection<any, any, any, any>;
}

export class RuleDescriptionBox {
  private descriptionBox: d3.Selection<SVGGElement, unknown, null, undefined>;
  private titleText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private appLinkText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private linkText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private nodeGroup: d3.Selection<any, any, any, any>;

  constructor({ containerGroup, nodeGroup }: RuleDescriptionBoxProps) {
    this.nodeGroup = nodeGroup;

    // Create description box container
    this.descriptionBox = containerGroup
      .append("g")
      .attr("class", "description-box")
      .style("display", "none")
      .attr("role", "dialog")
      .attr("aria-label", "Rule details");

    this.descriptionBox.append("rect").attr("fill", "white").attr("stroke", "#ccc").attr("rx", 4).attr("ry", 4);

    this.titleText = this.descriptionBox
      .append("text")
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("dy", "1em");

    this.appLinkText = this.descriptionBox
      .append("text")
      .attr("fill", "#0066cc")
      .attr("font-size", "12px")
      .attr("dy", "3em")
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .attr("tabindex", "0")
      .attr("role", "link")
      .text("View in App");

    this.linkText = this.descriptionBox
      .append("text")
      .attr("fill", "#0066cc")
      .attr("font-size", "12px")
      .attr("dy", "3em")
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .attr("tabindex", "0")
      .attr("role", "link")
      .text("View in Klamm");

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.appLinkText
      .on("keydown", (event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          this.hide();
          return;
        }
        const d: any = d3.select(event.target).datum();
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (d?.url) {
            const baseUrl = window.location.origin;
            window.open(`${baseUrl}/rule/${d.url}`);
          }
        }
      })
      .on("click", function () {
        const d: any = d3.select(this).datum();
        if (d?.url) {
          const baseUrl = window.location.origin;
          window.open(`${baseUrl}/rule/${d.url}`);
        }
      });

    this.linkText
      .on("keydown", (event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          this.hide();
          return;
        }
        const d: any = d3.select(event.target).datum();
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (d?.isPublished) {
            const baseUrl = process.env.NEXT_PUBLIC_KLAMM_URL;
            window.open(`${baseUrl}/rules/${d.name}`, "_blank");
          } else {
            message.error("Rule is not published in Klamm");
          }
        }
      })
      .on("click", function () {
        const d: any = d3.select(this).datum();
        if (d?.isPublished) {
          const baseUrl = process.env.NEXT_PUBLIC_KLAMM_URL;
          window.open(`${baseUrl}/rules/${d.name}`, "_blank");
        } else {
          message.error("Rule is not published in Klamm");
        }
      });
  }

  show(d: any) {
    const mouseX = d.x;
    const mouseY = d.y;

    this.descriptionBox.style("display", null).attr("transform", `translate(${mouseX + 20},${mouseY - 10})`);

    // Clear previous text
    this.titleText.selectAll("*").remove();

    // Add title
    this.titleText
      .attr("x", 10)
      .attr("y", 20)
      .append("tspan")
      .text(d.label || d.name);

    // Add meta info (name)
    this.titleText
      .append("tspan")
      .attr("x", 10)
      .attr("dy", 30)
      .attr("fill", "#666")
      .attr("font-family", "monospace")
      .attr("font-size", "11px")
      .text(`Name: ${d.name}`);

    // Add meta info (path)
    this.titleText
      .append("tspan")
      .attr("x", 10)
      .attr("dy", 20)
      .attr("fill", "#666")
      .attr("font-family", "monospace")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .text(`Path: ${d.filepath || "N/A"}`);

    // Add description
    this.addDescription(d);

    // Calculate and update box dimensions
    this.updateBoxDimensions(d);

    // Update data binding and focus
    this.appLinkText.datum(d);
    this.linkText.datum(d);

    this.nodeGroup.attr("tabindex", "-1");
    if (d.url) {
      this.appLinkText.node()?.focus();
    } else {
      this.linkText.node()?.focus();
    }
  }

  private addDescription(d: any) {
    const defaultDescription = "No description available";
    const words = (d.description || defaultDescription).split(/\s+/);
    let line = "";
    let lineNumber = 0;
    const lineHeight = 20;

    if (words.join(" ") === defaultDescription) {
      this.titleText
        .append("tspan")
        .attr("x", 10)
        .attr("dy", 30)
        .attr("fill", "black")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .text(defaultDescription);
    } else {
      words.forEach((word: string) => {
        const testLine = line + word + " ";
        if (testLine.length * 6 > 200) {
          this.titleText
            .append("tspan")
            .attr("x", 10)
            .attr("dy", lineNumber === 0 ? 30 : lineHeight)
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .text(line.trim());
          line = word + " ";
          lineNumber++;
        } else {
          line = testLine;
        }
      });

      if (line) {
        this.titleText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", lineNumber === 0 ? 0 : lineHeight)
          .attr("fill", "black")
          .attr("font-family", "sans-serif")
          .attr("font-size", "12px")
          .text(line.trim());
        lineNumber++;
      }
    }

    return lineNumber;
  }

  private updateBoxDimensions(d: any) {
    const titleHeight = 20;
    const metaHeight = 50;
    const spacingHeight = 30;
    const descriptionHeight = this.titleText.node()!.getBBox().height;
    const linkSpacing = 70;

    const totalHeight = titleHeight + metaHeight + spacingHeight + descriptionHeight + linkSpacing;

    // Position links
    this.appLinkText
      .attr("x", 10)
      .attr("y", totalHeight - 70)
      .style("opacity", d.url ? 1 : 0.5)
      .style("cursor", d.url ? "pointer" : "not-allowed")
      .attr("tabindex", d.url ? "0" : "-1");

    this.linkText.attr("x", 10).attr("y", totalHeight - 50);

    // Update box size
    const boxWidth = Math.max(300, this.titleText.node()!.getBBox().width + 40);
    this.descriptionBox.select("rect").attr("x", 0).attr("y", 0).attr("width", boxWidth).attr("height", totalHeight);
  }

  hide() {
    this.descriptionBox.style("display", "none");
    this.nodeGroup.attr("tabindex", "0");
  }

  isVisible(): boolean {
    return this.descriptionBox.style("display") !== "none";
  }

  getElement() {
    return this.descriptionBox;
  }
}
