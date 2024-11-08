"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import type { ReactFlowInstance } from "reactflow";
import "@gorules/jdm-editor/dist/style.css";
import { Spin, Modal } from "antd";
import { ApartmentOutlined, PlayCircleOutlined, LoginOutlined, LogoutOutlined, BookOutlined } from "@ant-design/icons";
import {
  JdmConfigProvider,
  DecisionGraph,
  NodeSpecification,
  DecisionGraphType,
  DecisionGraphRef,
  Simulation,
  createJdmNode,
  CustomNodeSpecification,
} from "@gorules/jdm-editor";
import { SchemaSelectProps, PanelType } from "@/app/types/jdm-editor";
import { Scenario, Variable } from "@/app/types/scenario";
import { downloadFileBlob } from "@/app/utils/utils";
import { createRuleJSONWithScenarios, convertTestsToScenarios } from "@/app/utils/ruleScenariosFormat";
import { createScenario, getScenariosByFilename } from "@/app/utils/api";
import { logError } from "@/app/utils/logger";
import LinkRuleComponent from "./subcomponents/LinkRuleComponent";
import SimulatorPanel from "./subcomponents/SimulatorPanel";
import RuleInputOutputFieldsComponent from "./subcomponents/RuleInputOutputFieldsComponent";
import NotesComponent from "./subcomponents/NotesComponent";
import ScenarioSelectionContent from "./subcomponents/ScenarioSelectionContent";

interface RuleViewerEditorProps {
  jsonFilename: string;
  ruleContent: DecisionGraphType;
  updateRuleContent: (updateGraph: DecisionGraphType) => void;
  contextToSimulate?: Record<string, any> | null;
  setContextToSimulate?: (results: Record<string, any>) => void;
  simulation?: Simulation;
  runSimulation?: (results: unknown) => void;
  isEditable?: boolean;
  setLoadingComplete: () => void;
  updateScenarios: () => void;
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
  setLoadingComplete,
  updateScenarios,
}: RuleViewerEditorProps) {
  const decisionGraphRef: any = useRef<DecisionGraphRef>();
  const [reactFlowRef, setReactFlowRef] = useState<ReactFlowInstance>();
  const [inputsSchema, setInputsSchema] = useState<SchemaSelectProps[]>([]);
  const [outputsSchema, setOutputsSchema] = useState<SchemaSelectProps[]>([]);

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
    setLoadingComplete();
    setReactFlowRef(reactFlow);
  };

  const downloadJSON = (jsonData: any, filename: string) => {
    downloadFileBlob(JSON.stringify(jsonData, null, 2), "application/json", filename);
  };

  const handleScenarioInsertion = async () => {
    try {
      const updatedJSON = await createRuleJSONWithScenarios(jsonFilename, ruleContent);
      return downloadJSON(updatedJSON, jsonFilename);
    } catch (error: any) {
      logError("Error fetching JSON:", error);
      throw error;
    }
  };

  const interceptJSONDownload = async (event: any) => {
    if (decisionGraphRef.current && event.target?.download === "graph.json") {
      event.preventDefault();
      try {
        await handleScenarioInsertion();
      } catch (error: any) {
        logError("Error intercepting JSON download:", error);
      }
    }
  };

  useEffect(() => {
    const handleFileSelect = (event: any) => {
      if (
        decisionGraphRef.current &&
        event.target?.accept === "application/json" &&
        event.target.type === "file" &&
        event.target.files.length > 0
      ) {
        const file = event.target.files[0];

        // Parse contents of the uploaded file
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            if (e.target?.result) {
              const fileContent = JSON.parse(e.target.result as string);
              await handleFileUpload(event, fileContent);
            }
          } catch (error) {
            console.error("Error parsing JSON file:", error);
          }
        };
        reader.readAsText(file);
      }
    };

    document.addEventListener("change", handleFileSelect, true);

    return () => {
      document.removeEventListener("change", handleFileSelect, true);
    };
  }, [decisionGraphRef, ruleContent]);

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

  const getRuleIdFromPath = () => {
    const match = window.location.pathname.match(/\/rule\/([^/]+)/);
    return match?.[1] ?? null;
  };

  const handleFileUpload = async (_event: any, uploadedContent: { tests?: any[] }) => {
    if (!uploadedContent?.tests) return;

    try {
      const [existingScenarios, scenarios] = await Promise.all([
        getScenariosByFilename(jsonFilename),
        Promise.resolve(convertTestsToScenarios(uploadedContent.tests)),
      ]);

      const existingTitles: Set<string> = new Set(existingScenarios.map((scenario: Scenario) => scenario.title));
      const newScenarios = scenarios.filter((scenario) => !existingTitles.has(scenario.title));

      if (newScenarios.length > 0) {
        let selectedScenarios: Scenario[] = [];

        Modal.confirm({
          title: "Import Scenarios",
          width: 600,
          maskClosable: false,
          closable: false,
          centered: true,
          content: (
            <ScenarioSelectionContent
              scenarios={newScenarios}
              onComplete={(selected) => {
                selectedScenarios = selected;
              }}
            />
          ),
          okText: "Import Selected",
          cancelText: "Cancel",
          onOk: async () => {
            if (selectedScenarios.length > 0) {
              const ruleId = getRuleIdFromPath();
              await Promise.all(
                selectedScenarios.map((scenario) =>
                  createScenario({ ...scenario, ruleID: ruleId, filepath: jsonFilename })
                )
              ).then(() => {
                updateScenarios();
              });
            }
          },
        });
      }
    } catch (error) {
      console.error("Failed to process scenarios:", error);
    }
  };

  const additionalComponents: NodeSpecification[] = useMemo(
    () => [
      // This is to add the decision node - note that this may be added to the DecisionGraph library eventually
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
      // Input node - overrides existing one (but duplication occurs atm)
      {
        type: "inputNode",
        displayName: "Request",
        shortDescription: "Provides input context",
        color: "secondary",
        icon: <LoginOutlined />,
        disabled: true,
        generateNode: ({ index }) => ({
          name: "Request",
          type: "inputNode",
          content: { fields: [] },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <RuleInputOutputFieldsComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            fieldsTypeLabel="Input"
            setInputOutputSchema={setInputsSchema}
            isEditable={isEditable}
          />
        ),
      },
      // Output node - overrides existing one (but duplication occurs atm)
      {
        type: "outputNode",
        displayName: "Response",
        shortDescription: "Outputs the context",
        color: "secondary",
        icon: <LogoutOutlined />,
        disabled: true,
        generateNode: ({ index }) => ({
          name: "Response",
          type: "outputNode",
          content: { fields: [] },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <RuleInputOutputFieldsComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            fieldsTypeLabel="Output"
            setInputOutputSchema={setOutputsSchema}
            isEditable={isEditable}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Simulator custom panel
  const panels: PanelType[] = useMemo(
    () =>
      (runSimulation &&
        setContextToSimulate && [
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
          } as PanelType,
        ]) ||
      [],
    [contextToSimulate, runSimulation, setContextToSimulate]
  );

  const customNodes: CustomNodeSpecification<any, any>[] = useMemo(
    () => [
      // Custom notes node
      createJdmNode({
        kind: "noteNode",
        group: "Markup",
        displayName: "Note",
        icon: <BookOutlined />,
        color: "grey",
        generateNode: ({ index }) => ({
          name: "Note",
          kind: "noteNode",
          config: {
            value: "",
          },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <NotesComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            isEditable={isEditable}
          />
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!ruleContent || !additionalComponents || !panels) {
    return (
      <Spin tip="Loading graph..." size="large" className="spinner">
        <div className="content" />
      </Spin>
    );
  }

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
        customNodes={customNodes}
        onChange={(updatedGraphValue) => updateRuleContent(updatedGraphValue)}
        disabled={!isEditable}
        inputsSchema={inputsSchema}
        outputsSchema={outputsSchema}
      />
    </JdmConfigProvider>
  );
}
