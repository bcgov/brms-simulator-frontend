"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import type { ReactFlowInstance } from "reactflow";
import "@gorules/jdm-editor/dist/style.css";
import {
  JdmConfigProvider,
  DecisionGraph,
  NodeSpecification,
  DecisionGraphType,
  DecisionGraphRef,
  Simulation,
} from "@gorules/jdm-editor";
import { ApartmentOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Scenario, Variable } from "@/app/types/scenario";
import LinkRuleComponent from "./subcomponents/LinkRuleComponent";
import SimulatorPanel from "./subcomponents/SimulatorPanel";
import { downloadFileBlob } from "@/app/utils/utils";
import { getScenariosByFilename } from "../../utils/api";

interface RuleViewerEditorProps {
  jsonFilename: string;
  ruleContent: DecisionGraphType;
  updateRuleContent: (updateGraph: DecisionGraphType) => void;
  contextToSimulate?: Record<string, any> | null;
  setContextToSimulate: (results: Record<string, any>) => void;
  simulation?: Simulation;
  runSimulation: (results: unknown) => void;
  isEditable?: boolean;
}

export default function RuleViewerEditor({
  jsonFilename,
  ruleContent,
  updateRuleContent,
  contextToSimulate,
  setContextToSimulate,
  simulation,
  runSimulation,
  isEditable = true,
}: RuleViewerEditorProps) {
  const decisionGraphRef: any = useRef<DecisionGraphRef>();
  const [reactFlowRef, setReactFlowRef] = useState<ReactFlowInstance>();

  useEffect(() => {
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
    // Fit to view
    fitGraphToView();
  }, [jsonFilename, reactFlowRef]);

  // Can set additional react flow options here if we need to change how graph looks when it's loaded in
  const reactFlowInit = (reactFlow: ReactFlowInstance) => {
    setReactFlowRef(reactFlow);
  };

  const downloadJSON = (jsonData: any, filename: string) => {
    downloadFileBlob(JSON.stringify(jsonData, null, 2), "application/json", filename);
  };

  const handleScenarioInsertion = async () => {
    try {
      const scenarios: Scenario[] = await getScenariosByFilename(jsonFilename);
      const scenarioObject = {
        tests: scenarios.map((scenario: Scenario) => ({
          name: scenario.title || "Default name",
          input: scenario.variables.reduce((obj: any, each: Variable) => {
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
        ...ruleContent,
        ...scenarioObject,
      };
      return downloadJSON(updatedJSON, jsonFilename);
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
  }, [ruleContent]);

  // This is to add the decision node - note that this may be added to the DecisionGraph library
  const additionalComponents: NodeSpecification[] = useMemo(
    () => [
      {
        type: "decisionNode",
        displayName: "Rule",
        shortDescription: "Linked rule to execute",
        icon: <ApartmentOutlined />,
        color: "#faad14",
        generateNode: () => ({ name: "Linked Rule" }),
        renderNode: ({ specification, id, selected, data }) => (
          <LinkRuleComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            isEditable={isEditable}
          />
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
        ref={decisionGraphRef}
        value={ruleContent}
        defaultOpenMenu={false}
        simulate={simulation}
        configurable
        onReactFlowInit={reactFlowInit}
        panels={panels}
        components={additionalComponents}
        onChange={(updatedGraphValue) => updateRuleContent(updatedGraphValue)}
        disabled={!isEditable}
      />
    </JdmConfigProvider>
  );
}
