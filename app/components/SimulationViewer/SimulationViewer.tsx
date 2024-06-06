"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Flex, Button } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { SubmissionData } from "../../types/submission";
import SubmissionSelector from "../SubmissionSelector";
import InputOutputTable from "../InputOutputTable";
import { RuleMap } from "../../types/rulemap";
import styles from "./SimulationViewer.module.css";

// Need to disable SSR when loading this component so it works properly
const RulesDecisionGraph = dynamic(() => import("../RulesDecisionGraph"), { ssr: false });

interface SimulationViewerProps {
  jsonFile: string;
  docId: string;
  chefsFormId: string;
  rulemap: RuleMap;
}

export default function SimulationViewer({ jsonFile, docId, chefsFormId, rulemap }: SimulationViewerProps) {
  const rulemapObject = rulemap.inputs.reduce((acc: { [x: string]: null }, obj: { property: string | number }) => {
    acc[obj.property] = null;
    return acc;
  }, {});
  const [selectedSubmissionInputs, setSelectedSubmissionInputs] = useState<SubmissionData>(rulemapObject);
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
      <Flex justify="space-between" align="center" className={styles.contentSection}>
        <Flex gap="middle">
          <SubmissionSelector chefsFormId={chefsFormId} setSelectedSubmissionInputs={setSelectedSubmissionInputs} />
          {selectedSubmissionInputs && (
            <>
              <Button size="large" type="primary" onClick={runSimulation}>
                Simulate ▶
              </Button>
              <Button size="large" type="default" onClick={() => setSelectedSubmissionInputs(rulemapObject)}>
                Reset ▶
              </Button>
            </>
          )}
        </Flex>
        <Link href={`https://submit.digital.gov.bc.ca/app/form/submit?f=${chefsFormId}`} target="_blank">
          <Button>
            Submission form <ExportOutlined />
          </Button>
        </Link>
      </Flex>
      <Flex gap="middle" wrap="wrap" className={styles.contentSection}>
        {selectedSubmissionInputs && (
          <InputOutputTable
            title="Inputs"
            rawData={selectedSubmissionInputs}
            setRawData={setSelectedSubmissionInputs}
          />
        )}
        {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} />}
      </Flex>
    </Flex>
  );
}
