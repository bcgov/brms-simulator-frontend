import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { message } from "antd";
import { CategoryObject } from "@/app/types/ruleInfo";
import { RuleMapRule, RuleNode, RuleLink } from "@/app/types/rulemap";
import styles from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay.module.css";
import { GraphTraversal } from "@/app/utils/graphUtils";
import { RuleGraphControls } from "./subcomponents/RuleGraphControls";

export interface RuleGraphProps {
  rules: RuleMapRule[];
  categories: CategoryObject[];
  filter?: string;
  width?: number;
  height?: number;
}

export default function RuleRelationsGraph({ rules, categories, filter, width = 1000, height = 1000 }: RuleGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [focusedNode, setFocusedNode] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(filter ?? "");
  const [showDraftRules, setShowDraftRules] = useState(true);

  // Checks for resizing of the container
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
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
    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any).on("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
          svg.transition().call(zoom.translateBy as any, 0, -10);
          break;
        case "ArrowDown":
          svg.transition().call(zoom.translateBy as any, 0, 10);
          break;
        case "ArrowLeft":
          svg.transition().call(zoom.translateBy as any, -10, 0);
          break;
        case "ArrowRight":
          svg.transition().call(zoom.translateBy as any, 10, 0);
          break;
        case "+":
          svg.transition().call(zoom.scaleBy as any, 1.2);
          break;
        case "-":
          svg.transition().call(zoom.scaleBy as any, 0.8);
          break;
      }
    });

    const controls = svg.append("g").attr("transform", `translate(10, ${height - 60})`);

    controls.append("rect").attr("width", 30).attr("height", 90).attr("fill", "white").attr("stroke", "#999");

    controls
      .append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("cursor", "pointer")
      .text("+")
      .on("click", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.scaleBy as any, 1.3);
      });

    controls
      .append("text")
      .attr("x", 15)
      .attr("y", 50)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("cursor", "pointer")
      .text("⟲")
      .on("click", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

    controls
      .append("text")
      .attr("x", 15)
      .attr("y", 80)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("cursor", "pointer")
      .text("−")
      .on("click", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.scaleBy as any, 0.7);
      });

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
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrow)");

    // Add arrow marker
    g.append("defs")
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

    // Draw nodes
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-label", (d) => `Rule: ${d.name}`)
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "#69b3a2");

    // Update label rendering
    nodeGroup
      .append("text")
      .text((d) => d.label || d.name) // Use label if available, fallback to name
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

    const graphTraversal = new GraphTraversal(links);

    const highlightConnections = (nodeId: number | null) => {
      if (nodeId === null) {
        highlightSearch(searchTerm);
        link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");
        return;
      }

      const ancestors = graphTraversal.getAllAncestors(nodeId);
      const descendants = graphTraversal.getAllDescendants(nodeId);
      const ancestorLinks = graphTraversal.getAncestorLinks(nodeId);
      const descendantLinks = graphTraversal.getDescendantLinks(nodeId);

      nodeGroup.selectAll("circle").attr("fill", (d: any) => {
        if (d.id === nodeId) return "#ff7f50";
        if (ancestors.has(d.id)) return "#4169e1";
        if (descendants.has(d.id)) return "#32cd32";
        return "#69b3a2";
      });

      // Update labels
      nodeGroup
        .selectAll("text")
        .style("font-weight", (d: any) =>
          d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? "bold" : "normal"
        );

      // Update links
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

      // Update opacity
      nodeGroup.style("opacity", (d: any) =>
        d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? 1 : 0.3
      );
    };

    // Searching with highlight
    const getNodesForCategory = (nodes: RuleNode[], category: string): Set<number> => {
      const matchingNodes = new Set<number>();

      nodes.forEach((node) => {
        // Skip unpublished rules if showDraftRules is false
        if (!showDraftRules && !node.isPublished) return;

        // If no category filter, add all published/draft nodes based on showDraftRules
        if (!category) {
          matchingNodes.add(node.id);
          return;
        }

        // Category search
        if (node.filepath?.includes(category)) {
          matchingNodes.add(node.id);

          // Add all related rules (that match publication status)
          const ancestors = graphTraversal.getAllAncestors(node.id);
          const descendants = graphTraversal.getAllDescendants(node.id);

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

    const highlightSearch = (term: string) => {
      const searchPattern = term.toLowerCase();
      const visibleNodes = getNodesForCategory(nodes, categoryFilter);

      nodeGroup.style("display", (d: any) => {
        const isVisible = showDraftRules || d.isPublished;
        return isVisible ? null : "none";
      });

      // Only apply styles to visible nodes
      nodeGroup.each(function (d: any) {
        const node = d3.select(this);
        const matchesSearch = d.name.toLowerCase().includes(searchPattern);
        const matchesCategory = visibleNodes.has(d.id);
        const isPublished = showDraftRules || d.isPublished;

        if (isPublished) {
          node.select("circle").attr("fill", matchesSearch ? "#ff7f50" : "#69b3a2");

          node.select("text").style("font-weight", matchesSearch ? "bold" : "normal");

          node.style("opacity", matchesSearch && matchesCategory ? 1 : 0.2);
        }
      });

      // Update link visibility and opacity
      link
        .style("display", (l: any) => {
          const sourceVisible =
            visibleNodes.has((l.source as any).id) && (showDraftRules || (l.source as any).isPublished);
          const targetVisible =
            visibleNodes.has((l.target as any).id) && (showDraftRules || (l.target as any).isPublished);
          return sourceVisible && targetVisible ? null : "none";
        })
        .style("opacity", (l: any) => {
          const sourceVisible = visibleNodes.has((l.source as any).id);
          const targetVisible = visibleNodes.has((l.target as any).id);
          return sourceVisible && targetVisible ? 0.6 : 0.1;
        });
    };

    const filteredOnly = (term: string) => {
      const searchPattern = term.toLowerCase();
      const visibleNodes = getNodesForCategory(nodes, categoryFilter);

      // Filter the nodeGroup to only show matching nodes
      nodeGroup.each(function (d: any) {
        const matchesSearch = searchPattern === "" || d.name.toLowerCase().includes(searchPattern);
        const matchesCategory = visibleNodes.has(d.id);
        const isVisible = matchesSearch && matchesCategory;

        if (!isVisible) {
          d3.select(this).remove();
        } else {
          // Apply styles to visible nodes
          d3.select(this)
            .selectAll("circle")
            .attr("fill", d.name.toLowerCase().includes(searchPattern) ? "#ff7f50" : "#69b3a2");

          d3.select(this)
            .selectAll("text")
            .style("font-weight", d.name.toLowerCase().includes(searchPattern) ? "bold" : "normal");
        }
      });

      // Remove links that don't connect visible nodes
      link.each(function (d: any) {
        const sourceVisible = visibleNodes.has(d.source.id);
        const targetVisible = visibleNodes.has(d.target.id);
        if (!sourceVisible || !targetVisible) {
          d3.select(this).remove();
        }
      });
    };

    // Add event listener for search term changes
    const handleSearch = () => {
      if (filter) {
        filteredOnly(searchTerm);
      } else {
        highlightSearch(searchTerm);
      }
    };

    // Initial search highlight
    handleSearch();

    // On click set selected node
    nodeGroup.on("click", (event, d: any) => {
      event.stopPropagation();
      highlightConnections(d.id);
    });

    // Reset on background click
    svg.on("click", () => {
      highlightConnections(null);
    });

    // Drag functions combined with zoom
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Add hover effects
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

    // Add description box container
    const descriptionBox = g
      .append("g")
      .attr("class", "description-box")
      .style("display", "none")
      .attr("role", "dialog")
      .attr("aria-label", "Rule details");

    descriptionBox.append("rect").attr("fill", "white").attr("stroke", "#ccc").attr("rx", 4).attr("ry", 4);

    const descriptionText = descriptionBox
      .append("text")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .attr("dy", "1em");

    const appLinkText = descriptionBox
      .append("text")
      .attr("fill", "#0066cc")
      .attr("font-size", "12px")
      .attr("dy", "3em")
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .attr("tabindex", "0")
      .attr("role", "link")
      .text("View in App")
      .style("opacity", 0.5)
      .on("keydown", function (event) {
        if (event.key === "Escape") {
          event.stopPropagation();
          hideDescriptionBox();

          highlightConnections(null);
          return;
        }
        const d: any = d3.select(this).datum();
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

    const linkText = descriptionBox
      .append("text")
      .attr("fill", "#0066cc")
      .attr("font-size", "12px")
      .attr("dy", "3em")
      .style("text-decoration", "underline")
      .style("cursor", "pointer")
      .attr("tabindex", "0")
      .attr("role", "link")
      .text("View in Klamm")
      .on("keydown", function (event) {
        if (event.key === "Escape") {
          event.stopPropagation();
          hideDescriptionBox();

          highlightConnections(null);
          return;
        }
        const d: any = d3.select(this).datum();
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

    // Add title text element after description box container
    const titleText = descriptionBox
      .append("text")
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("dy", "1em");

    const hideDescriptionBox = () => {
      descriptionBox.style("display", "none");
      setFocusedNode(null);
      nodeGroup.attr("tabindex", "0");
    };

    // Update showDescriptionBox function
    const showDescriptionBox = (d: any) => {
      const mouseX = d.x;
      const mouseY = d.y;

      // Set initial position
      descriptionBox.style("display", null).attr("transform", `translate(${mouseX + 20},${mouseY - 10})`);

      // Clear previous text
      titleText.selectAll("*").remove();
      descriptionText.selectAll("*").remove();

      // Add title
      titleText
        .attr("x", 10)
        .attr("y", 20)
        .append("tspan")
        .text(d.label || d.name);

      // Add meta info (name)
      titleText
        .append("tspan")
        .attr("x", 10)
        .attr("dy", 30)
        .attr("fill", "#666")
        .attr("font-family", "monospace")
        .attr("font-size", "11px")
        .text(`Name: ${d.name}`);

      // Add meta info (path)
      titleText
        .append("tspan")
        .attr("x", 10)
        .attr("dy", 20)
        .attr("fill", "#666")
        .attr("font-family", "monospace")
        .attr("font-size", "11px")
        .attr("font-style", "italic")
        .text(`Path: ${d.filepath || "N/A"}`);

      // Add description
      const defaultDescription = "No description available";
      const words = (d.description || defaultDescription).split(/\s+/);
      let line = "";
      let lineNumber = 0;
      const lineHeight = 20;

      if (words.join(" ") === defaultDescription) {
        titleText
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
            titleText
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
          titleText
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

      // Calculate total height needed
      const titleHeight = 20; // Title
      const metaHeight = 50; // Name + Path
      const spacingHeight = 30; // Space before description
      const descriptionHeight = lineNumber * lineHeight; // Description
      const linkSpacing = 70; // Space for links

      const totalHeight = titleHeight + metaHeight + spacingHeight + descriptionHeight + linkSpacing;

      // Position links with proper spacing
      appLinkText
        .attr("x", 10)
        .attr("y", totalHeight - 70)
        .style("opacity", d.url ? 1 : 0.5)
        .style("cursor", d.url ? "pointer" : "not-allowed")
        .attr("tabindex", d.url ? "0" : "-1");

      linkText.attr("x", 10).attr("y", totalHeight - 50);

      // Update box size to fit all content
      const boxWidth = Math.max(300, titleText.node()!.getBBox().width + 40);

      descriptionBox.select("rect").attr("x", 0).attr("y", 0).attr("width", boxWidth).attr("height", totalHeight); // Add padding at bottom

      // Update data binding and focus
      appLinkText.datum(d);
      linkText.datum(d);

      nodeGroup.attr("tabindex", "-1");
      if (d.url) {
        appLinkText.node()?.focus();
      } else {
        linkText.node()?.focus();
      }
    };

    // Update the click handler
    nodeGroup.selectAll("text").on("click", function (event: MouseEvent, d: any) {
      event.stopPropagation();
      showDescriptionBox(d);
      setFocusedNode(d);
      highlightConnections(d.id);
    });

    // Update node keydown handler
    nodeGroup
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-label", (d) => `Rule: ${d.name}`)
      .on("keydown", (event, d: any) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          hideDescriptionBox();

          highlightConnections(null);
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const isCurrentlyShown = descriptionBox.style("display") !== "none";

          if (isCurrentlyShown && focusedNode === d) {
            hideDescriptionBox();
          } else {
            showDescriptionBox(d);
            setFocusedNode(d);
            highlightConnections(d.id);
          }
        } else if (event.key === "Escape") {
          hideDescriptionBox();
        }
      })
      .on("focus", (event, d) => {
        setFocusedNode(d);
      })
      .on("blur", () => {
        if (!descriptionBox.style("display")) {
          setFocusedNode(null);
        }
      });

    // Add click handler to hide description box
    svg.on("click", () => {
      hideDescriptionBox();
    });

    // Update svg click handler to reset everything
    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        // Only trigger if clicking the SVG background
        hideDescriptionBox();
        highlightConnections(null);
      }
    });

    // Update the node click handler
    nodeGroup.on("click", (event, d: any) => {
      event.stopPropagation(); // Stop event from reaching SVG background
      highlightConnections(d.id);
    });

    // Update the node text click handler
    nodeGroup.selectAll("text").on("click", function (event: MouseEvent, d: any) {
      event.stopPropagation(); // Stop event from reaching SVG background
      showDescriptionBox(d);
      setFocusedNode(d);
      highlightConnections(d.id);
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as any).x)
        .attr("y1", (d) => (d.source as any).y)
        .attr("x2", (d) => (d.target as any).x)
        .attr("y2", (d) => (d.target as any).y);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Add instructions for keyboard users
    svg
      .append("title")
      .text("Use arrow keys to pan, + and - to zoom, Tab to navigate between nodes, Enter to open rule");

    // Add keydown handler to the SVG for global keyboard events
    svg.on("keydown", (event) => {
      if (event.key === "Escape") {
        hideDescriptionBox();
        highlightConnections(null);
        return;
      }

      // Handle zoom/pan keys
      switch (event.key) {
        case "ArrowUp":
          svg.transition().call(zoom.translateBy as any, 0, -10);
          break;
        case "ArrowDown":
      }
    });

    // Add escape handler to description box links
    appLinkText.on("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        hideDescriptionBox();
        highlightConnections(null);
        return;
      }
    });

    linkText.on("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        hideDescriptionBox();
        highlightConnections(null);
        return;
      }
    });

    return () => {
      simulation.stop();
    };
  }, [rules, dimensions, searchTerm, categoryFilter, showDraftRules]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleShowDraftRulesChange = (value: boolean) => {
    setShowDraftRules(value);
  };

  const handleLegendToggle = () => {
    setIsLegendMinimized(!isLegendMinimized);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <RuleGraphControls
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        showDraftRules={showDraftRules}
        isLegendMinimized={isLegendMinimized}
        categories={categories}
        filter={filter}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onShowDraftRulesChange={handleShowDraftRulesChange}
        onLegendToggle={handleLegendToggle}
        onClearFilters={handleClearFilters}
      />
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}
