"use client";
import { useState, useMemo, useEffect } from "react";
import type { ReactFlowInstance } from "reactflow";
import "@gorules/jdm-editor/dist/style.css";
import {
  JdmConfigProvider,
  DecisionGraph,
  NodeSpecification,
  DecisionGraphType,
  Simulation,
} from "@gorules/jdm-editor";
import { Spin, message } from "antd";
import { ApartmentOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Scenario } from "@/app/types/scenario";
import { SubmissionData } from "../../types/submission";
import LinkRuleComponent from "./LinkRuleComponent";
import SimulatorPanel from "./SimulatorPanel";
import { getDocument, postDecision, getRuleRunSchema, getScenariosByFilename } from "../../utils/api";
import styles from "./RulesDecisionGraph.module.css";

interface RulesViewerProps {
  graphJSON: DecisionGraphType;
  contextToSimulate?: SubmissionData | null;
  setContextToSimulate: (results: Record<string, any>) => void;
  simulation?: Simulation;
  runSimulation: (results: unknown) => void;
  setResultsOfSimulation: (results: Record<string, any>) => void;
  setOutputsOfSimulation: (outputs: Record<string, any>) => void;
  isEditable?: boolean;
}

export default function RulesDecisionGraph({
  graphJSON,
  contextToSimulate,
  setContextToSimulate,
  simulation,
  runSimulation,
  setResultsOfSimulation,
  setOutputsOfSimulation,
  isEditable = true,
}: RulesViewerProps) {
  const [graphValue, setGraphValue] = useState<any>(graphJSON);
  const decisionGraphRef: any = useRef<DecisionGraphRef>();
  const [reactFlowRef, setReactFlowRef] = useState<ReactFlowInstance>();

  useEffect(() => {
    setGraphValue(graphJSON);
    fitGraphToView();
  }, [graphJSON]);

  useEffect(() => {
    fitGraphToView();
  }, [reactFlowRef]);

  // Ensure graph is in view
  const fitGraphToView = () => {
    if (reactFlowRef) {
      reactFlowRef.fitView();
      // Set timeout to fix issue with trying to fit view because fully loaded
      setTimeout(() => {
        reactFlowRef.fitView();
      }, 100);
    }
  };

  // Can set additional react flow options here if we need to change how graph looks when it's loaded in
  const reactFlowInit = (reactFlow: ReactFlowInstance) => {
    setReactFlowRef(reactFlow);
  };

  useEffect(() => {
    try {
      // Run the simulator when the context updates
      decisionGraphRef?.current?.runSimulator(contextToSimulate);
    } catch (e: any) {
      message.error("An error occurred while running the simulator: " + e);
      console.error("Error running the simulator:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextToSimulate]);

  const simulateRun = async ({ context }: { context: unknown }) => {
    if (contextToSimulate) {
      console.info("Simulate:", context);
      try {
        const data = await postDecision(graphValue, context);
        console.info("Simulation Results:", data, data?.result);
        // Check if data.result is an array and throw error as object is required
        if (Array.isArray(data?.result)) {
          throw new Error("Please update your rule and ensure that outputs are on one line.");
        }

        setResultsOfSimulation(data?.result);
        const ruleRunSchema = await getRuleRunSchema(data);
        // Filter out properties from ruleRunSchema outputs that are also present in data.result
        const uniqueOutputs = Object.keys(ruleRunSchema?.result?.output || {}).reduce((acc: any, key: string) => {
          if (!(key in data?.result)) {
            acc[key] = ruleRunSchema?.result[key];
          }
          return acc;
        }, {});

        setOutputsOfSimulation(uniqueOutputs);
        return { result: data };
      } catch (e: any) {
        message.error("Error during simulation run: " + e);
        console.error("Error during simulation run:", e);
        return { result: {} };
      }
    }
    // Reset the result if there is no contextToSimulate (used to reset the trace)
    return { result: {} };
  };

  const downloadJSON = (jsonData: any, filename: string) => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleScenarioInsertion = async () => {
    try {
      const jsonData = await getDocument(graphValue);
      const scenarios: Scenario[] = await getScenariosByFilename(graphValue);
      const scenarioObject = {
        tests: scenarios.map((scenario) => ({
          name: scenario.title || "Default name",
          input: scenario.variables.reduce((obj, each) => {
            obj[each.name] = each.value;
            return obj;
          }, {}),
          output: scenario.expectedResults.reduce((obj, each) => {
            obj[each.name] = each.value;
            return obj;
          }, {}),
        })),
      };
      const updatedJSON = {
        ...jsonData,
        ...scenarioObject,
      };
      return downloadJSON(updatedJSON, graphValue);
    } catch (error) {
      console.error("Error fetching JSON:", error);
      throw error;
    }
  };

  const interceptJSONDownload = async (event: any) => {
    if (decisionGraphRef.current && event.target?.download === "graph.json") {
      event.preventDefault();
      try {
        await handleScenarioInsertion();
      } catch (error) {
        console.error("Error intercepting JSON download:", error);
      }
    }
  };

  useEffect(() => {
    const clickHandler = (event: any) => {
      interceptJSONDownload(event);
    };

    document.addEventListener("click", clickHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This is to add the decision node - note that this may be added to the DecisionGraph library
  const additionalComponents: NodeSpecification[] = useMemo(
    () => [
      {
        type: "decisionNode",
        displayName: "Rule",
        shortDescription: "Linked rule to execute",
        icon: <ApartmentOutlined />,
        generateNode: () => ({ name: "Linked Rule" }),
        renderNode: ({ specification, id, selected, data }) => (
          <LinkRuleComponent specification={specification} id={id} isSelected={selected} name={data?.name} />
        ),
      },
    ],
    []
  );

  // Simulator custom panel
  const panels = useMemo(
    () => [
      {
        id: "simulator",
        title: "Simulator",
        icon: <PlayCircleOutlined />,
        renderPanel: () => (
          <SimulatorPanel
            contextToSimulate={contextToSimulate}
            runSimulation={runSimulation}
            setContextToSimulate={setContextToSimulate}
          />
        ),
      },
    ],
    [contextToSimulate, runSimulation, setContextToSimulate]
  );

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
        value={graphValue}
        defaultOpenMenu={false}
        simulate={simulation}
        configurable
        onReactFlowInit={reactFlowInit}
        panels={panels}
        components={additionalComponents}
        onChange={(updatedGraphValue) => setGraphValue(updatedGraphValue)}
        disabled={!isEditable}
      />
    </JdmConfigProvider>
  );
}
