"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Flex, Button, Spin, Tabs } from "antd";
import type { TabsProps } from "antd";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import { getDocument, postDecision } from "../../utils/api";
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
  rulemap: RuleMap;
  scenarios: Scenario[];
  isEditable?: boolean;
}

export default function SimulationViewer({
  ruleId,
  jsonFile,
  rulemap,
  scenarios,
  isEditable = false,
}: SimulationViewerProps) {
  const createRuleMap = (array: any[], defaultObj: { rulemap: boolean }) => {
    return array.reduce((acc, obj) => {
      acc[obj.property] = null;
      return acc;
    }, defaultObj);
  };

  const ruleMapInputs = createRuleMap(rulemap.inputs, { rulemap: true });
  const ruleMapOutputs = createRuleMap(rulemap.outputs, { rulemap: true });
  const ruleMapFinalOutputs = createRuleMap(rulemap.finalOutputs, { rulemap: true });

  const [graphJSON, setGraphJSON] = useState<DecisionGraphType>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<SubmissionData>();
  const [selectedSubmissionInputs, setSelectedSubmissionInputs] = useState<SubmissionData>(ruleMapInputs);
  //const [contextToSimulate, setContextToSimulate] = useState<SubmissionData | null>();
  const [outputSchema, setOutputSchema] = useState<Record<string, any> | null>(ruleMapOutputs);
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);
  const simulateButtonRef = useRef<HTMLButtonElement>(null);

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
    setOutputSchema(ruleMapOutputs);
    setResultsOfSimulation(ruleMapFinalOutputs);
  };

  const runSimulation = async (newContext?: unknown) => {
    // TODO: Update to get graph data so backend can run on that instead of file
    if (newContext) {
      setSimulationContext(newContext);
    }
    const runContext = newContext || simulationContext;
    if (runContext) {
      console.info("Simulate:", runContext);
      const data = await postDecision(jsonFile, runContext);
      console.info("Simulation Results:", data, data?.result);
      setSimulation({ result: data });
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

  if (!graphJSON) {
    return (
      <Spin tip="Loading graph..." size="large" className={styles.spinner}>
        <div className="content" />
      </Spin>
    );
  }

  useEffect(() => {}, [resultsOfSimulation]);

  const handleTabChange = (key: string) => {
    if (key === "1") {
      handleReset();
    }
  };

  const handleReset = () => {
    setSelectedSubmissionInputs({});
    setTimeout(() => {
      setSelectedSubmissionInputs(ruleMapInputs);
    }, 0);
    setResetTrigger((prev) => !prev);
  };

  const scenarioTab = (
    <>
      <Flex gap="small" vertical>
        <ScenarioViewer
          scenarios={scenarios}
          setSelectedSubmissionInputs={setSelectedSubmissionInputs}
          resultsOfSimulation={resultsOfSimulation}
          runSimulation={runSimulation}
          rulemap={rulemap}
        />
      </Flex>
    </>
  );

  const scenarioGenerator = (
    <Flex gap="small">
      <ScenarioGenerator
        scenarios={scenarios}
        setSelectedSubmissionInputs={setSelectedSubmissionInputs}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        selectedSubmissionInputs={selectedSubmissionInputs}
        resetTrigger={resetTrigger}
        ruleId={ruleId}
        jsonFile={jsonFile}
        rulemap={rulemap}
      />
      <Button onClick={handleReset} size="large" type="primary">
        Reset ↻
      </Button>
    </Flex>
  );

  const scenarioTests = (
    <Flex gap="small">
      <ScenarioTester jsonFile={jsonFile} />
    </Flex>
  );

  const csvScenarioTests = (
    <Flex gap="small">
      <ScenarioTester jsonFile={jsonFile} uploader />
    </Flex>
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Simulate pre-defined test scenarios",
      children: scenarioTab,
    },
    {
      key: "2",
      label: "Simulate inputs manually and create new scenarios",
      children: scenarioGenerator,
    },
    {
      key: "3",
      label: "Scenario Results",
      children: scenarioTests,
    },
    {
      key: "4",
      label: "CSV Tests",
      children: csvScenarioTests,
    },
  ];

  return (
    <Flex gap="large" vertical>
      <div className={styles.rulesWrapper}>
        <RulesDecisionGraph
          graphJSON={graphJSON}
          contextToSimulate={simulationContext}
          setContextToSimulate={setSimulationContext}
          simulation={simulation}
          runSimulation={runSimulation}
          isEditable={isEditable}
        />
      </div>
      <Flex justify="space-between" align="center" className={styles.contentSection}>
        <Flex gap="middle" justify="space-between">
          <Tabs defaultActiveKey="3" tabBarStyle={{ gap: "10rem" }} items={items} onChange={handleTabChange}></Tabs>
        </Flex>
      </Flex>
    </Flex>
  );
}
