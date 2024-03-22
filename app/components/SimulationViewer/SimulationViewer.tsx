"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Flex, Button } from "antd";
import { SubmissionData } from "../../types/submission";
import SubmissionSelector from "../SubmissionSelector";
import InputOutputTable from "../InputOutputTable";
import styles from "./SimulationViewer.module.css";

// Need to disable SSR when loading this component so it works properly
const RulesDecisionGraph = dynamic(() => import("../RulesDecisionGraph"), { ssr: false });

interface SimulationViewerProps {
  jsonFile: string;
  docId: string;
  chefsFormId: string;
}

export default function SimulationViewer({ jsonFile, docId, chefsFormId }: SimulationViewerProps) {
  const [selectedSubmissionInputs, setSelectedSubmissionInputs] = useState<SubmissionData>();
  const [contextToSimulate, setContextToSimulate] = useState<SubmissionData | null>();
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();

  const resetContextAndResults = () => {
    setContextToSimulate(null);
    setResultsOfSimulation(null);
  };

  const runSimulation = () => {
    // set the context to simulate - RulesDecisionGraph will use this context to run the simulation
    setContextToSimulate(selectedSubmissionInputs);
  };

  useEffect(() => {
    // reset context/results when a new submission is selected
    resetContextAndResults();
  }, [selectedSubmissionInputs]);

  return (
    <Flex gap="large" vertical>
      <div className={styles.rulesWrapper}>
        <RulesDecisionGraph
          jsonFile={jsonFile}
          docId={docId}
          contextToSimulate={contextToSimulate}
          setResultsOfSimulation={setResultsOfSimulation}
        />
      </div>
      <Flex gap="middle" className={styles.contentSection}>
        <SubmissionSelector chefsFormId={chefsFormId} setSelectedSubmissionInputs={setSelectedSubmissionInputs} />
        {selectedSubmissionInputs && (
          <Button size="large" type="primary" onClick={runSimulation}>
            Simulate ▶
          </Button>
        )}
      </Flex>
      <Flex gap="middle" wrap="wrap" className={styles.contentSection}>
        {selectedSubmissionInputs && <InputOutputTable title="Inputs" rawData={selectedSubmissionInputs} />}
        {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} />}
      </Flex>
    </Flex>
  );
}
