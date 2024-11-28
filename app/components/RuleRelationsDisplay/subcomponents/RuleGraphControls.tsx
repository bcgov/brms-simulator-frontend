import { Button, Select, Input, Flex, Checkbox } from "antd";
import { CategoryObject } from "@/app/types/ruleInfo";
import styles from "../RuleRelationsDisplay.module.css";

interface RuleGraphControlsProps {
  searchTerm: string;
  categoryFilter: string;
  showDraftRules: boolean;
  isLegendMinimized: boolean;
  categories: CategoryObject[];
  embeddedCategory?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShowDraftRulesChange: (value: boolean) => void;
  onLegendToggle: () => void;
  onClearFilters: () => void;
}

export function RuleGraphControls({
  searchTerm,
  categoryFilter,
  showDraftRules,
  isLegendMinimized,
  categories,
  embeddedCategory,
  onSearchChange,
  onCategoryChange,
  onShowDraftRulesChange,
  onLegendToggle,
  onClearFilters,
}: RuleGraphControlsProps) {
  return (
    <Flex
      gap="small"
      vertical
      aria-label="Graph Controls"
      className={styles.controls}
      style={{ maxHeight: isLegendMinimized ? (embeddedCategory ? "40px" : "110px") : "500px" }}
    >
      <Flex gap="small" align="center">
        <Flex gap="small" align="center" wrap>
          {!embeddedCategory && (
            <>
              <Input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                className={styles.input}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search rules"
              />
              <Select
                value={categoryFilter}
                onChange={onCategoryChange}
                aria-label="Filter by category"
                placeholder="Filter by category"
                className={styles.select}
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((cat) => ({ value: cat.value, label: cat.text })),
                ]}
              />
              <Button onClick={onClearFilters} className={styles.button} danger>
                Clear
              </Button>
            </>
          )}
          <Button
            onClick={onLegendToggle}
            className={styles.button}
            aria-label={isLegendMinimized ? "Show legend" : "Hide legend"}
          >
            {isLegendMinimized ? "+ Show Legend" : "- Hide Legend"}
          </Button>
          {!embeddedCategory && (
            <Checkbox
              onChange={(e) => onShowDraftRulesChange(e.target.checked)}
              checked={showDraftRules}
              className={styles.checkbox}
            >
              Include draft rules
            </Checkbox>
          )}
        </Flex>
      </Flex>
      <div
        className={styles.collapsible}
        style={{
          opacity: isLegendMinimized ? 0 : 1,
          pointerEvents: isLegendMinimized ? "none" : "auto",
        }}
      >
        <Flex vertical className={styles.legend}>
          <p className={styles.legendTitle}>Legend:</p>
          <Flex vertical gap="small">
            <Flex align="center" className={styles.legendItem}>
              <div className={styles.parentLine} />
              <span>Parent Rules</span>
            </Flex>
            <Flex align="center" className={styles.legendItem}>
              <div className={styles.childLine} />
              <span>Child Rules</span>
            </Flex>
            <Flex align="center" className={styles.legendItem}>
              <div className={styles.selectedDot} />
              <span>Selected Rule</span>
            </Flex>
          </Flex>
        </Flex>

        <Flex vertical className={styles.legend}>
          <p className={styles.legendTitle}>Interactions:</p>
          <ul className={styles.helpList}>
            <li>Click a node to see all its relationships</li>
            <li>Click node text to view rule details</li>
            <li>Click background to reset view</li>
          </ul>
        </Flex>

        <p className={styles.instructions}>
          Use arrow keys to pan, + and - to zoom, Tab to navigate between nodes, Enter to open rule
        </p>
      </div>
    </Flex>
  );
}
