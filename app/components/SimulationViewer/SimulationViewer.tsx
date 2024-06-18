"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Flex, Button, Tabs } from "antd";
import type { TabsProps } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { SubmissionData } from "../../types/submission";
import InputOutputTable from "../InputOutputTable";
import { RuleMap } from "../../types/rulemap";
import { Scenario } from "@/app/types/scenario";
import styles from "./SimulationViewer.module.css";
import ScenarioViewer from "../ScenarioViewer/ScenarioViewer";
import ScenarioGenerator from "../ScenarioGenerator/ScenarioGenerator";

// Need to disable SSR when loading this component so it works properly
const RulesDecisionGraph = dynamic(() => import("../RulesDecisionGraph"), { ssr: false });

interface SimulationViewerProps {
  ruleId: string;
  jsonFile: string;
  chefsFormId: string;
  rulemap: RuleMap;
  scenarios: Scenario[];
}

export default function SimulationViewer({ ruleId, jsonFile, rulemap, scenarios }: SimulationViewerProps) {
  const createRuleMap = (array: any[], defaultObj: { rulemap: boolean }) => {
    return array.reduce((acc, obj) => {
      acc[obj.property] = null;
      return acc;
    }, defaultObj);
  };

  const ruleMapInputs = createRuleMap(rulemap.inputs, { rulemap: true });
  const ruleMapOutputs = createRuleMap(rulemap.outputs, { rulemap: true });
  const ruleMapFinalOutputs = createRuleMap(rulemap.finalOutputs, { rulemap: true });

  const [selectedSubmissionInputs, setSelectedSubmissionInputs] = useState<SubmissionData>(ruleMapInputs);
  const [contextToSimulate, setContextToSimulate] = useState<SubmissionData | null>();
  const [outputSchema, setOutputSchema] = useState<Record<string, any> | null>(ruleMapOutputs);
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);
  const simulateButtonRef = useRef<HTMLButtonElement>(null);

  const resetContextAndResults = () => {
    setContextToSimulate(null);
    setOutputSchema(ruleMapOutputs);
    setResultsOfSimulation(ruleMapFinalOutputs);
  };

  const runSimulation = () => {
    // set the context to simulate - RulesDecisionGraph will use this context to run the simulation
    setContextToSimulate(selectedSubmissionInputs);
  };

  useEffect(() => {
    // reset context/results when a new submission is selected
    resetContextAndResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubmissionInputs]);

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
      <ScenarioViewer
        scenarios={scenarios}
        setSelectedSubmissionInputs={setSelectedSubmissionInputs}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
      />
      <a href={`/api/scenario/evaluation/${encodeURIComponent(jsonFile)}`}>Export Scenario Results</a>
    </>
  );

  const scenarioGenerator = (
    <Flex gap="small">
      <ScenarioGenerator
        scenarios={scenarios}
        setSelectedSubmissionInputs={setSelectedSubmissionInputs}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        simulateButtonRef={simulateButtonRef}
        selectedSubmissionInputs={selectedSubmissionInputs}
        outputSchema={outputSchema}
        setOutputSchema={setOutputSchema}
        resetTrigger={resetTrigger}
        ruleId={ruleId}
        jsonFile={jsonFile}
      />
      <Button onClick={handleReset} size="large" type="primary">
        Reset ↻
      </Button>
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
  ];

  return (
    <Flex gap="large" vertical>
      <div className={styles.rulesWrapper}>
        <RulesDecisionGraph
          jsonFile={jsonFile}
          contextToSimulate={contextToSimulate}
          setResultsOfSimulation={setResultsOfSimulation}
          setOutputsOfSimulation={setOutputSchema}
        />
      </div>
      <Flex justify="space-between" align="center" className={styles.contentSection}>
        <Flex gap="middle" justify="space-between">
          <Tabs defaultActiveKey="1" tabBarStyle={{ gap: "10rem" }} items={items} onChange={handleTabChange}></Tabs>
        </Flex>
      </Flex>
    </Flex>
  );
}
