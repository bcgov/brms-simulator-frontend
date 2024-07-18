"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Flex, Button, Spin, Tabs, message } from "antd";
import type { TabsProps } from "antd";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import { getDocument, postDecision, getRuleMap } from "../../utils/api";
import { RuleMap } from "../../types/rulemap";
import { Scenario } from "@/app/types/scenario";
import styles from "./SimulationViewer.module.css";
import ScenarioViewer from "../ScenarioViewer/ScenarioViewer";
import ScenarioGenerator from "../ScenarioGenerator/ScenarioGenerator";
import ScenarioTester from "../ScenarioTester/ScenarioTester";

// Need to disable SSR when loading this component so it works properly
const RulesDecisionGraph = dynamic(() => import("../RulesDecisionGraph"), { ssr: false });

interface SimulationViewerProps {
  ruleId: string;
  jsonFile: string;
  rulemap?: RuleMap;
  scenarios?: Scenario[];
  isNewRule?: boolean;
  editing?: boolean;
}

export default function SimulationViewer({
  ruleId,
  jsonFile,
  scenarios,
  isNewRule = false,
  editing = true,
}: SimulationViewerProps) {
  const createRuleMap = (array: any[] = [], preExistingContext?: Record<string, any>) => {
    return array.reduce(
      (acc, obj) => {
        if (preExistingContext?.hasOwnProperty(obj.property)) {
          acc[obj.property] = preExistingContext[obj.property];
        } else {
          acc[obj.property] = null;
        }
        return acc;
      },
      { rulemap: true }
    );
  };

  const [ruleContent, setRuleContent] = useState<DecisionGraphType>();
  const [rulemap, setRulemap] = useState<RuleMap>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<Record<string, any>>();
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDocument(jsonFile);
        setRuleContent(data);
      } catch (error) {
        console.error("Error fetching JSON:", error);
      }
    };
    if (isNewRule) {
      setRuleContent({ nodes: [], edges: [] });
    } else {
      fetchData();
    }
  }, [jsonFile]);

  useEffect(() => {
    const canBeSchemaMapped = () => {
      if (!ruleContent?.nodes) return false;
      // Must contain an outputNode in order for schema mapping to work
      return ruleContent.nodes.some((node) => node.type === "outputNode");
    };
    const updateRuleMap = async () => {
      const updatedRulemap: RuleMap = await getRuleMap(jsonFile, ruleContent);
      setRulemap(updatedRulemap);
      const ruleMapInputs = createRuleMap(updatedRulemap?.inputs, simulationContext);
      setSimulationContext(ruleMapInputs);
    };
    if (canBeSchemaMapped()) {
      updateRuleMap();
    }
  }, [ruleContent]);

  const resetContextAndResults = () => {
    setSimulation(undefined);
    const ruleMapResultOutputs = createRuleMap(rulemap?.resultOutputs);
    setResultsOfSimulation(ruleMapResultOutputs);
  };

  const runSimulation = async (newContext?: unknown) => {
    if (!ruleContent) {
      throw new Error("No graph json for simulation");
    }
    if (newContext) {
      setSimulationContext(newContext);
    }
    const runContext = newContext || simulationContext;
    if (runContext) {
      console.info("Simulate:", runContext);
      try {
        const data = await postDecision(ruleContent, runContext);
        console.info("Simulation Results:", data, data?.result);
        // Check if data.result is an array and throw error as object is required
        if (Array.isArray(data?.result)) {
          throw new Error("Please update your rule and ensure that outputs are on one line.");
        }
        // Set the simulation
        setSimulation({ result: data });
        // Set the results of the simulation
        setResultsOfSimulation(data?.result);
      } catch (e: any) {
        message.error("Error during simulation run: " + e);
        console.error("Error during simulation run:", e);
      }
    } else {
      // Reset the result if there is no contextToSimulate (used to reset the trace)
      setSimulation({});
    }
  };

  useEffect(() => {
    // reset simulation/results when context changes
    resetContextAndResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationContext]);

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
        editing={editing}
      />
    </Flex>
  );

  const scenarioGeneratorTab = scenarios && rulemap && (
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
        editing={editing}
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
      <ScenarioTester jsonFile={jsonFile} ruleContent={ruleContent} uploader />
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
      disabled: !editing,
    },
    {
      key: "4",
      label: "CSV Tests",
      children: csvScenarioTestsTab,
      disabled: !editing,
    },
  ];

  if (!ruleContent) {
    return (
      <Spin tip="Loading graph..." size="large" className={styles.spinner}>
        <div className="content" />
      </Spin>
    );
  }

  const filteredItems = editing ? items : items?.filter((item) => item.disabled !== true) || [];

  return (
    <Flex gap="large" vertical>
      <div className={styles.rulesWrapper}>
        <RulesDecisionGraph
          jsonFilename={jsonFile}
          ruleContent={ruleContent}
          setRuleContent={setRuleContent}
          contextToSimulate={simulationContext}
          setContextToSimulate={setSimulationContext}
          simulation={simulation}
          runSimulation={runSimulation}
          isEditable={editing}
        />
      </div>
      {scenarios && rulemap && (
        <Flex justify="space-between" align="center" className={styles.contentSection}>
          <Flex gap="middle" justify="space-between">
            <Tabs
              className={styles.tabs}
              defaultActiveKey={editing ? "3" : "1"}
              tabBarStyle={{ gap: "10rem" }}
              items={filteredItems}
              onChange={handleTabChange}
            ></Tabs>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
