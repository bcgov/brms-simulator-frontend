import React, { useState } from "react";
import { Flex, Button, Tabs } from "antd";
import type { TabsProps } from "antd";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { Scenario } from "@/app/types/scenario";
import { RuleMap } from "@/app/types/rulemap";
import ScenarioViewer from "./ScenarioViewer";
import ScenarioGenerator from "./ScenarioGenerator";
import ScenarioTester from "./ScenarioTester";
import ScenarioCSV from "./ScenarioCSV";
import styles from "./ScenariosManager.module.css";

interface ScenariosManagerProps {
  ruleId: string;
  jsonFile: string;
  ruleContent: DecisionGraphType;
  rulemap: RuleMap;
  scenarios?: Scenario[];
  isEditing: boolean;
  showAllScenarioTabs?: boolean;
  createRuleMap: (array: any[], preExistingContext?: Record<string, any>) => RuleMap;
  simulationContext?: Record<string, any>;
  setSimulationContext: (newContext: Record<string, any>) => void;
  runSimulation: (newContext?: Record<string, any>) => void;
  resultsOfSimulation?: Record<string, any> | null;
}

export default function ScenariosManager({
  ruleId,
  jsonFile,
  ruleContent,
  rulemap,
  scenarios,
  isEditing,
  showAllScenarioTabs,
  createRuleMap,
  simulationContext,
  setSimulationContext,
  runSimulation,
  resultsOfSimulation,
}: ScenariosManagerProps) {
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);

  const handleTabChange = (key: string) => {
    handleReset();
  };

  const handleReset = () => {
    setSimulationContext({});
    setTimeout(() => {
      const ruleMapInputs = createRuleMap(rulemap?.inputs);
      setSimulationContext(ruleMapInputs);
    }, 0);
    setResetTrigger((prev) => !prev);
  };

  const scenarioTab = scenarios && rulemap && (
    <Flex gap="small" vertical>
      <ScenarioViewer
        scenarios={scenarios}
        setSimulationContext={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        rulemap={rulemap}
        editing={isEditing}
      />
    </Flex>
  );

  const scenarioGeneratorTab = scenarios && rulemap && ruleId && (
    <Flex gap="small " className={styles.scenarioGeneratorTab}>
      <ScenarioGenerator
        scenarios={scenarios}
        simulationContext={simulationContext}
        setSimulationContext={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        resetTrigger={resetTrigger}
        ruleId={ruleId}
        jsonFile={jsonFile}
        rulemap={rulemap}
        editing={isEditing}
      />
      <Button onClick={handleReset} size="large" type="primary">
        Reset ↻
      </Button>
    </Flex>
  );

  const scenarioTestsTab = (
    <Flex gap="small">
      <ScenarioTester jsonFile={jsonFile} ruleContent={ruleContent} />
    </Flex>
  );

  const csvScenarioTestsTab = (
    <Flex gap="small">
      <ScenarioCSV jsonFile={jsonFile} ruleContent={ruleContent} />
    </Flex>
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Simulate scenarios",
      children: scenarioTab,
      disabled: false,
    },
    {
      key: "2",
      label: "Simulate manual inputs",
      children: scenarioGeneratorTab,
      disabled: false,
    },
    {
      key: "3",
      label: "Scenario Results",
      children: scenarioTestsTab,
      disabled: !showAllScenarioTabs,
    },
    {
      key: "4",
      label: "CSV Tests",
      children: csvScenarioTestsTab,
      disabled: !showAllScenarioTabs,
    },
  ];

  const filteredItems = showAllScenarioTabs ? items : items?.filter((item) => item.disabled !== true) || [];

  return (
    <Flex justify="space-between" align="center" className={styles.contentSection}>
      <Flex gap="middle" justify="space-between">
        <Tabs
          className={styles.tabs}
          defaultActiveKey={showAllScenarioTabs ? "3" : "1"}
          items={filteredItems}
          onChange={handleTabChange}
        ></Tabs>
      </Flex>
    </Flex>
  );
}
