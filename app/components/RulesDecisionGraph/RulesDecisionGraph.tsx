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
import { ApartmentOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { SubmissionData } from "../../types/submission";
import LinkRuleComponent from "./LinkRuleComponent";
import SimulatorPanel from "./SimulatorPanel";

interface RulesViewerProps {
  graphJSON: DecisionGraphType;
  contextToSimulate?: SubmissionData | null;
  setContextToSimulate: (results: Record<string, any>) => void;
  simulation?: Simulation;
  runSimulation: (results: unknown) => void;
  isEditable?: boolean;
}

export default function RulesDecisionGraph({
  graphJSON,
  contextToSimulate,
  setContextToSimulate,
  simulation,
  runSimulation,
  isEditable = true,
}: RulesViewerProps) {
  const [graphValue, setGraphValue] = useState<any>(graphJSON);
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
