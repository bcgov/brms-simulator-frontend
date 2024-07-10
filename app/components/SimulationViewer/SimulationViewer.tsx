"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Flex, Button, Spin, Tabs, message } from "antd";
import type { TabsProps } from "antd";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import { getDocument, postDecision, getRuleRunSchema } from "../../utils/api";
import { SubmissionData } from "../../types/submission";
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
  editing?: boolean;
}

export default function SimulationViewer({
  ruleId,
  jsonFile,
  rulemap,
  scenarios,
  editing = true,
}: SimulationViewerProps) {
  const createRuleMap = (array: any[]) => {
    return array.reduce(
      (acc, obj) => {
        acc[obj.property] = null;
        return acc;
      },
      { rulemap: true }
    );
  };

  const ruleMapInputs = createRuleMap(rulemap?.inputs || []);
  const ruleMapResultOutputs = createRuleMap(rulemap?.resultOutputs || []);

  const [graphJSON, setGraphJSON] = useState<DecisionGraphType>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<SubmissionData>(ruleMapInputs);
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDocument(jsonFile);
        setGraphJSON(data);
      } catch (error) {
        console.error("Error fetching JSON:", error);
      }
    };
    fetchData();
  }, [jsonFile]);

  const resetContextAndResults = () => {
    setSimulation(undefined);
    setResultsOfSimulation(ruleMapResultOutputs);
  };

  const runSimulation = async (newContext?: unknown) => {
    // TODO: Update to get graph data so backend can run on that instead of file
    if (newContext) {
      setSimulationContext(newContext);
    }
    const runContext = newContext || simulationContext;
    if (runContext) {
      console.info("Simulate:", runContext);
      try {
        const data = await postDecision(jsonFile, runContext);
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
    // reset context/results when a new submission is selected
    resetContextAndResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationContext]);

  const handleTabChange = (key: string) => {
    if (key === "1") {
      handleReset();
    }
  };

  const handleReset = () => {
    setSimulationContext({});
    setTimeout(() => {
      setSimulationContext(ruleMapInputs);
    }, 0);
    setResetTrigger((prev) => !prev);
  };

  const scenarioTab = scenarios && rulemap && (
    <Flex gap="small" vertical>
      <ScenarioViewer
        scenarios={scenarios}
        setSelectedSubmissionInputs={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        rulemap={rulemap}
        editing={editing}
      />
    </Flex>
  );

  const scenarioGeneratorTab = scenarios && rulemap && (
    <Flex gap="small">
      <ScenarioGenerator
        scenarios={scenarios}
        setSelectedSubmissionInputs={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        selectedSubmissionInputs={simulationContext}
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
      <ScenarioTester jsonFile={jsonFile} />
    </Flex>
  );

  const csvScenarioTestsTab = (
    <Flex gap="small">
      <ScenarioTester jsonFile={jsonFile} uploader />
    </Flex>
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Simulate pre-defined test scenarios",
      children: scenarioTab,
      disabled: false,
    },
    {
      key: "2",
      label: "Simulate inputs manually and create new scenarios",
      children: scenarioGeneratorTab,
      disabled: false,
    },
    {
      key: "3",
      label: "Scenario Results",
      children: scenarioTestsTab,
      disabled: editing ? false : true,
    },
    {
      key: "4",
      label: "CSV Tests",
      children: csvScenarioTestsTab,
      disabled: editing ? false : true,
    },
  ];

  if (!graphJSON) {
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
          graphJSON={graphJSON}
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
