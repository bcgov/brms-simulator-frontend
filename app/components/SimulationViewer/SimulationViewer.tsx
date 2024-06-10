"use client";
import React, { useState, useEffect, useRef } from "react";
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
  console.log(ruleMapOutputs, "this is the rule map outputs");

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

  return (
    <Flex gap="large" vertical>
      <div className={styles.rulesWrapper}>
        <RulesDecisionGraph
          jsonFile={jsonFile}
          docId={docId}
          contextToSimulate={contextToSimulate}
          setResultsOfSimulation={setResultsOfSimulation}
          setOutputsOfSimulation={setOutputSchema}
        />
      </div>
      <Flex justify="space-between" align="center" className={styles.contentSection}>
        <Flex gap="middle">
          <SubmissionSelector
            chefsFormId={chefsFormId}
            setSelectedSubmissionInputs={setSelectedSubmissionInputs}
            resetTrigger={resetTrigger}
          />
          {selectedSubmissionInputs && (
            <>
              <Button ref={simulateButtonRef} size="large" type="primary" onClick={runSimulation}>
                Simulate ▶
              </Button>
              <Button
                size="large"
                type="default"
                onClick={() => {
                  setSelectedSubmissionInputs(ruleMapInputs);
                  setResetTrigger((prev) => !prev);
                }}
              >
                Reset ↻
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
            submitButtonRef={simulateButtonRef}
          />
        )}
        {outputSchema && <InputOutputTable title="Outputs" rawData={outputSchema} setRawData={setOutputSchema} />}
        {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} />}
      </Flex>
    </Flex>
  );
}
