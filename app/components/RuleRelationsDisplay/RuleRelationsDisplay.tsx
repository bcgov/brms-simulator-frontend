import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { CategoryObject } from "@/app/types/ruleInfo";

interface Rule {
  id: number;
  name: string;
  label: string;
  child_rules: Rule[];
  parent_rules: Rule[];
  description: string | null;
  url: string | undefined;
  filepath: string | undefined;
}

interface RuleNode extends d3.SimulationNodeDatum {
  id: number;
  name: string;
  label: string;
  radius: number;
  isHighlighted?: boolean;
  description: string | null;
  url: string | undefined;
  filepath: string | undefined;
}

interface RuleLink extends d3.SimulationLinkDatum<RuleNode> {
  source: number;
  target: number;
}

interface RuleGraphProps {
  rules: Rule[];
  categories: CategoryObject[];
  width?: number;
  height?: number;
}

export default function RuleRelationsGraph({ rules, categories, width = 1000, height = 400 }: RuleGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [focusedNode, setFocusedNode] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

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

    const uniqueRules = new Map<number, Rule>();
    rules.forEach((rule) => {
      if (!uniqueRules.has(rule.id)) {
        uniqueRules.set(rule.id, rule);
      }
    });

    const nodes: RuleNode[] = Array.from(uniqueRules.values()).map((rule) => ({
      id: rule.id,
      name: rule.name,
      label: rule.label,
      radius: 8,
      description: rule.description || null,
      url: rule.url,
      filepath: rule.filepath,
    }));

    // Create links only between existing nodes
    const links: RuleLink[] = [];
    uniqueRules.forEach((rule) => {
      if (rule.parent_rules) {
        rule.parent_rules.forEach((parent) => {
          if (uniqueRules.has(parent.id)) {
            links.push({
              source: parent.id,
              target: rule.id,
            });
          }
        });
      }
      if (rule.child_rules) {
        rule.child_rules.forEach((child) => {
          if (uniqueRules.has(child.id)) {
            links.push({
              source: rule.id,
              target: child.id,
            });
          }
        });
      }
    });

    nodes.sort((a, b) => a.id - b.id);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.7)
      )
      .force("charge", d3.forceManyBody().strength(-300).distanceMax(350))
      .force("x", d3.forceX().strength(0.05))
      .force("y", d3.forceY().strength(0.05))
      .force("collision", d3.forceCollide().radius(45));

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

    // Add labels
    nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("font-size", "10px")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("cursor", "pointer")
      .attr("role", "link")
      .style("text-decoration", "underline")
      .style("fill", "#0066cc")
      .on("mouseover", function () {
        d3.select(this).style("fill", "#003366");
      })
      .on("mouseout", function () {
        d3.select(this).style("fill", "#0066cc");
      });

    // Get all connected nodes
    const getAllAncestors = (nodeId: number, visited = new Set<number>()): Set<number> => {
      const ancestors = new Set<number>();
      if (visited.has(nodeId)) return ancestors;
      visited.add(nodeId);

      links.forEach((link) => {
        const sourceId = (link.source as any).id;
        const targetId = (link.target as any).id;

        if (targetId === nodeId) {
          ancestors.add(sourceId);
          const parentAncestors = getAllAncestors(sourceId, visited);
          parentAncestors.forEach((id) => ancestors.add(id));
        }
      });

      return ancestors;
    };

    const getAllDescendants = (nodeId: number, visited = new Set<number>()): Set<number> => {
      const descendants = new Set<number>();
      if (visited.has(nodeId)) return descendants;
      visited.add(nodeId);

      links.forEach((link) => {
        const sourceId = (link.source as any).id;
        const targetId = (link.target as any).id;

        if (sourceId === nodeId) {
          descendants.add(targetId);
          const childDescendants = getAllDescendants(targetId, visited);
          childDescendants.forEach((id) => descendants.add(id));
        }
      });

      return descendants;
    };

    const getAncestorLinks = (nodeId: number): RuleLink[] => {
      const ancestors = getAllAncestors(nodeId);
      return links.filter((link) => {
        const sourceId = (link.source as any).id;
        const targetId = (link.target as any).id;
        return (
          (ancestors.has(sourceId) && ancestors.has(targetId)) ||
          (ancestors.has(sourceId) && targetId === nodeId) ||
          targetId === nodeId
        );
      });
    };

    const getDescendantLinks = (nodeId: number): RuleLink[] => {
      const descendants = getAllDescendants(nodeId);
      return links.filter((link) => {
        const sourceId = (link.source as any).id;
        const targetId = (link.target as any).id;
        return (
          (descendants.has(sourceId) && descendants.has(targetId)) ||
          (descendants.has(targetId) && sourceId === nodeId) ||
          sourceId === nodeId
        );
      });
    };

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

      nodeGroup
        .selectAll("circle")
        .attr("fill", (d: any) => {
          if (d.id === nodeId) return "#ff7f50";
          if (ancestors.has(d.id)) return "#4169e1";
          if (descendants.has(d.id)) return "#32cd32";
          return "#69b3a2";
        })
        .attr("r", (d: any) => (d.id === nodeId ? d.radius * 1.4 : d.radius));

      // Update labels
      nodeGroup
        .selectAll("text")
        .style("font-weight", (d: any) =>
          d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? "bold" : "normal"
        );

      // Update links
      link
        .attr("stroke", (l: any) => {
          if (ancestorLinks.includes(l)) return "#4169e1";
          if (descendantLinks.includes(l)) return "#32cd32";
          return "#999";
        })
        .attr("stroke-opacity", (l: any) => (ancestorLinks.includes(l) || descendantLinks.includes(l) ? 1 : 0.2))
        .attr("stroke-width", (l: any) => (ancestorLinks.includes(l) || descendantLinks.includes(l) ? "2" : "1"));

      // Update opacity
      nodeGroup.style("opacity", (d: any) =>
        d.id === nodeId || ancestors.has(d.id) || descendants.has(d.id) ? 1 : 0.3
      );
    };

    // Searching with highlight
    const getNodesForCategory = (nodes: RuleNode[], category: string): Set<number> => {
      if (!category) return new Set(nodes.map((n) => n.id));

      const matchingNodes = new Set<number>();
      nodes.forEach((node) => {
        //category search
        if (node.filepath?.includes(category)) {
          matchingNodes.add(node.id);

          // Add all related rules
          const ancestors = getAllAncestors(node.id);
          ancestors.forEach((id) => matchingNodes.add(id));
          const descendants = getAllDescendants(node.id);
          descendants.forEach((id) => matchingNodes.add(id));
        }
      });

      return matchingNodes;
    };

    const highlightSearch = (term: string) => {
      const searchPattern = term.toLowerCase();
      const visibleNodes = getNodesForCategory(nodes, categoryFilter);

      nodeGroup
        .selectAll("circle")
        .attr("fill", (d: any) => (d.name.toLowerCase().includes(searchPattern) ? "#ff7f50" : "#69b3a2"))
        .attr("r", (d: any) => (d.name.toLowerCase().includes(searchPattern) ? d.radius * 1.4 : d.radius));

      nodeGroup
        .selectAll("text")
        .style("font-weight", (d: any) => (d.name.toLowerCase().includes(searchPattern) ? "bold" : "normal"));

      // Update opacity based on both search and category
      nodeGroup.style("opacity", (d: any) => {
        const matchesSearch = searchPattern === "" || d.name.toLowerCase().includes(searchPattern);
        const matchesCategory = visibleNodes.has(d.id);
        return matchesSearch && matchesCategory ? 1 : 0.2;
      });

      // Update link opacity
      link.style("opacity", (l: any) => {
        const sourceVisible = visibleNodes.has((l.source as any).id);
        const targetVisible = visibleNodes.has((l.target as any).id);
        return sourceVisible && targetVisible ? 0.6 : 0.1;
      });
    };

    // Add event listener for search term changes
    const handleSearch = () => {
      highlightSearch(searchTerm);
    };

    // Initial search highlight
    handleSearch();

    // On click set selected node
    nodeGroup.on("click", (event, d: any) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);
      highlightConnections(d.id);
    });

    // Reset on background click
    svg.on("click", () => {
      setSelectedNodeId(null);
      highlightConnections(null);
    });

    // Hover effects for nodes
    nodeGroup
      .select("circle")
      .on("mouseover", function (event, d: any) {
        if (d.id !== selectedNodeId) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", d.radius * 1.2);
        }
      })
      .on("mouseout", function (event, d: any) {
        if (d.id !== selectedNodeId) {
          d3.select(this).transition().duration(200).attr("r", d.radius);
        }
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
          setSelectedNodeId(null);
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
          setSelectedNodeId(null);
          highlightConnections(null);
          return;
        }
        const d: any = d3.select(this).datum();
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const baseUrl = process.env.NEXT_PUBLIC_KLAMM_URL;
          window.open(`${baseUrl}/rules/${d.name}`, "_blank");
        }
      })
      .on("click", function () {
        const d: any = d3.select(this).datum();
        const baseUrl = process.env.NEXT_PUBLIC_KLAMM_URL;
        window.open(`${baseUrl}/rules/${d.name}`, "_blank");
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

      // Add title with padding
      titleText.attr("x", 10).attr("y", 20).append("tspan").text(d.label);

      // Update description text with wrapping
      const words = (d.description || "No description available").split(/\s+/);
      const lineHeight = 20;
      let line = "";
      let lineNumber = 0;

      // Position description text below title
      descriptionText.attr("x", 10).attr("y", 50);

      words.forEach((word: string) => {
        const testLine = line + word + " ";
        if (testLine.length * 6 > 200) {
          // Add the current line
          descriptionText
            .append("tspan")
            .attr("x", 10)
            .attr("dy", lineNumber === 0 ? 0 : lineHeight)
            .text(line.trim());

          line = word + " ";
          lineNumber++;
        } else {
          line = testLine;
        }
      });

      // Add the last line if there's any text left
      if (line) {
        descriptionText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", lineNumber === 0 ? 0 : lineHeight)
          .text(line.trim());
        lineNumber++;
      }

      // Calculate total height needed for description
      const descriptionHeight = (lineNumber + 1) * lineHeight;

      // Position links below description
      const linksY = 10 + descriptionHeight;

      appLinkText
        .attr("x", 10)
        .attr("y", linksY)
        .style("opacity", d.url ? 1 : 0.5)
        .style("cursor", d.url ? "pointer" : "not-allowed")
        .attr("tabindex", d.url ? "0" : "-1");

      linkText.attr("x", 10).attr("y", linksY + 25);

      // Calculate and set box dimensions
      const titleBox = titleText.node()!.getBBox();
      const textBox = descriptionText.node()!.getBBox();
      const totalHeight = linksY + 70; // Add padding for links
      const boxWidth = Math.max(200, titleBox.width, textBox.width) + 20;

      // Update box size and position
      descriptionBox.select("rect").attr("x", 0).attr("y", 0).attr("width", boxWidth).attr("height", totalHeight);

      // Make description box links focusable and other elements not focusable
      nodeGroup.attr("tabindex", "-1");
      if (d.url) {
        appLinkText.node()?.focus();
      } else {
        linkText.node()?.focus();
      }

      // Update the data binding for the links
      appLinkText.datum(d);
      linkText.datum(d);
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
          setSelectedNodeId(null);
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
        setSelectedNodeId(null);
        highlightConnections(null);
      }
    });

    // Update the node click handler
    nodeGroup.on("click", (event, d: any) => {
      event.stopPropagation(); // Stop event from reaching SVG background
      setSelectedNodeId(d.id);
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
        setSelectedNodeId(null);
        highlightConnections(null);
        return;
      }

      // Handle zoom/pan keys
      switch (event.key) {
        case "ArrowUp":
          svg.transition().call(zoom.translateBy as any, 0, -10);
          break;
        case "ArrowDown":
        // ...rest of the existing key handlers...
      }
    });

    // Add escape handler to description box links
    appLinkText.on("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        hideDescriptionBox();
        setSelectedNodeId(null);
        highlightConnections(null);
        return;
      }
    });

    linkText.on("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        hideDescriptionBox();
        setSelectedNodeId(null);
        highlightConnections(null);
        return;
      }
    });

    return () => {
      simulation.stop();
    };
  }, [rules, dimensions, searchTerm, categoryFilter]); // Add dimensions to dependency array

  return (
    <div
      ref={containerRef}
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "100%",
        height: "100%",
        minHeight: "400px",
        maxHeight: "80vh",
      }}
    >
      <div
        role="region"
        aria-label="Graph Controls"
        style={{
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "300px",
          transition: "all 0.3s ease",
          maxHeight: isLegendMinimized ? "60px" : "500px",
          overflow: "hidden",
        }}
      >
        {/* Search section with minimize button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flex: 1, gap: "8px" }}>
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
              aria-label="Search rules"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.text}
                </option>
              ))}
            </select>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer" }}
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setIsLegendMinimized(!isLegendMinimized)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              cursor: "pointer",
              backgroundColor: "white",
            }}
            aria-label={isLegendMinimized ? "Show legend" : "Hide legend"}
          >
            {isLegendMinimized ? "+" : "−"}
          </button>
        </div>

        {/* Collapsible sections */}
        <div
          style={{
            opacity: isLegendMinimized ? 0 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: isLegendMinimized ? "none" : "auto",
          }}
        >
          {/* Legend Section */}
          <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px", fontSize: "12px" }}>
            <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>Legend:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "2px", backgroundColor: "#4169e1" }} />
                <span>Parent Rules</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "20px", height: "2px", backgroundColor: "#32cd32" }} />
                <span>Child Rules</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#ff7f50",
                    borderRadius: "50%",
                  }}
                />
                <span>Selected Rule</span>
              </div>
            </div>
          </div>

          {/* Interaction Help */}
          <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px", fontSize: "12px" }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>Interactions:</p>
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li>Click a node to see all its relationships</li>
              <li>Click node text to view rule details</li>
              <li>Click background to reset view</li>
            </ul>
          </div>

          <p style={{ margin: 0, fontSize: "12px", borderTop: "1px solid #ccc", paddingTop: "8px" }}>
            Use arrow keys to pan, + and - to zoom, Tab to navigate between nodes, Enter to open rule
          </p>
        </div>
      </div>
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "calc(100% - 60px)",
          background: "#fff",
        }}
      />
    </div>
  );
}
