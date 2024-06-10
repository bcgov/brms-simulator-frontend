"use client";
import { useState, useEffect, useRef } from "react";
import "@gorules/jdm-editor/dist/style.css";
import { JdmConfigProvider, DecisionGraph, DecisionGraphRef } from "@gorules/jdm-editor";
import { DecisionGraphType } from "@gorules/jdm-editor/dist/components/decision-graph/context/dg-store.context";
import type { ReactFlowInstance } from "reactflow";
import { Spin } from "antd";
import { SubmissionData } from "../../types/submission";
import { getDocument, postDecision, getOutputSchema } from "../../utils/api";
import styles from "./RulesDecisionGraph.module.css";

interface RulesViewerProps {
  jsonFile: string;
  docId: string;
  contextToSimulate?: SubmissionData | null;
  setResultsOfSimulation: (results: Record<string, any>) => void;
  setOutputsOfSimulation: (outputs: Record<string, any>) => void;
}

export default function RulesDecisionGraph({
  jsonFile,
  docId,
  contextToSimulate,
  setResultsOfSimulation,
  setOutputsOfSimulation,
}: RulesViewerProps) {
  const decisionGraphRef: any = useRef<DecisionGraphRef>();
  const [graphJSON, setGraphJSON] = useState<DecisionGraphType>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDocument(docId);
        setGraphJSON(data);
      } catch (error) {
        console.error("Error fetching JSON:", error);
      }
    };
    fetchData();
  }, [docId]);

  // Can set additional react flow options here if we need to change how graph looks when it's loaded in
  const reactFlowInit = (reactFlow: ReactFlowInstance) => {
    reactFlow.fitView(); // ensure graph is in view
  };

  useEffect(() => {
    // Run the simulator when the context updates
    decisionGraphRef?.current?.runSimulator(contextToSimulate);
  }, [contextToSimulate]);

  const simulateRun = async ({ decisionGraph, context }: { decisionGraph: DecisionGraphType; context: unknown }) => {
    if (contextToSimulate) {
      console.info("Simulate:", context);
      const data = await postDecision(jsonFile, decisionGraph, context);
      console.info("Simulation Results:", data, data?.result);
      setResultsOfSimulation(data?.result);
      const outputData = await getOutputSchema(data);
      // Filter out properties from outputData that are also present in data.result
      const uniqueOutputs = Object.keys(outputData?.result || {}).reduce((acc: any, key: string) => {
        if (!(key in data?.result)) {
          acc[key] = outputData?.result[key];
        }
        return acc;
      }, {});

      setOutputsOfSimulation(uniqueOutputs);
      return { result: data };
    }
    // Reset the result if there is no contextToSimulate (used to reset the trace)
    return { result: {} };
  };

  if (!graphJSON) {
    return (
      <Spin tip="Loading graph..." size="large" className={styles.spinner}>
        <div className="content" />
      </Spin>
    );
  }

  return (
    <JdmConfigProvider>
      <DecisionGraph
        ref={decisionGraphRef}
        value={graphJSON}
        disabled
        defaultOpenMenu={false}
        onSimulationRun={simulateRun}
        configurable
        onReactFlowInit={reactFlowInit}
      />
    </JdmConfigProvider>
  );
}
