"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Flex, Button, Spin } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import { getDocument, postDecision } from "../../utils/api";
import { SubmissionData } from "../../types/submission";
import SubmissionSelector from "../SubmissionSelector";
import InputOutputTable from "../InputOutputTable";
import styles from "./SimulationViewer.module.css";

// Need to disable SSR when loading this component so it works properly
const RulesDecisionGraph = dynamic(() => import("../RulesDecisionGraph"), { ssr: false });

interface SimulationViewerProps {
  jsonFile: string;
  chefsFormId?: string;
  isEditable?: boolean;
}

export default function SimulationViewer({ jsonFile, chefsFormId, isEditable }: SimulationViewerProps) {
  const [graphJSON, setGraphJSON] = useState<DecisionGraphType>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<SubmissionData>();

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
  }, [simulationContext]);

  if (!graphJSON) {
    return (
      <Spin tip="Loading graph..." size="large" className={styles.spinner}>
        <div className="content" />
      </Spin>
    );
  }

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
      {chefsFormId && (
        <>
          <Flex justify="space-between" align="center" className={styles.contentSection}>
            <Flex gap="middle">
              <SubmissionSelector chefsFormId={chefsFormId} setSelectedSubmissionInputs={setSimulationContext} />
              {simulationContext && (
                <Button size="large" type="primary" onClick={runSimulation}>
                  Simulate ▶
                </Button>
              )}
            </Flex>
            <Link href={`https://submit.digital.gov.bc.ca/app/form/submit?f=${chefsFormId}`} target="_blank">
              <Button>
                Submission form <ExportOutlined />
              </Button>
            </Link>
          </Flex>
          <Flex gap="middle" wrap="wrap" className={styles.contentSection}>
            {simulationContext && <InputOutputTable title="Inputs" rawData={simulationContext} />}
            {simulation && "result" in simulation && simulation.result !== undefined && (
              <InputOutputTable title="Results" rawData={simulation.result.result || {}} />
            )}
          </Flex>
        </>
      )}
    </Flex>
  );
}
