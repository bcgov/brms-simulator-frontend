import { useEffect, useRef, useState } from "react";
import { CategoryObject } from "@/app/types/ruleInfo";
import { RuleMapRule } from "@/app/types/rulemap";
import styles from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay.module.css";
import { RuleGraphControls } from "./subcomponents/RuleGraphControls";
import { useRuleGraph } from "./hooks/useRuleGraph";

export interface RuleGraphProps {
  rules: RuleMapRule[];
  categories: CategoryObject[];
  embeddedCategory?: string;
  width?: number;
  height?: number;
}

export default function RuleRelationsGraph({
  rules,
  categories,
  embeddedCategory,
  width = 1000,
  height = 1000,
}: RuleGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(embeddedCategory ?? "");
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

  useRuleGraph({
    rules,
    svgRef,
    dimensions,
    searchTerm,
    categoryFilter,
    showDraftRules,
    embeddedCategory,
  });

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
        embeddedCategory={embeddedCategory}
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
