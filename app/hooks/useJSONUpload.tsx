import { useEffect, useCallback } from "react";
import { Modal } from "antd";
import { Scenario } from "@/app/types/scenario";
import { createScenario, getScenariosByFilename } from "@/app/utils/api";
import { convertTestsToScenarios, createRuleJSONWithScenarios } from "@/app/utils/ruleScenariosFormat";
import { downloadFileBlob } from "@/app/utils/utils";
import { logError } from "@/app/utils/logger";
import ScenarioSelectionContent from "../components/RuleViewerEditor/subcomponents/ScenarioSelectionContent";
import { DecisionGraphType } from "@gorules/jdm-editor";

export const useJSONUpload = (
  jsonFilename: string,
  updateScenarios: () => void,
  decisionGraphRef: any,
  ruleContent?: DecisionGraphType
) => {
  const downloadJSON = (jsonData: any, filename: string) => {
    downloadFileBlob(JSON.stringify(jsonData, null, 2), "application/json", filename);
  };

  const handleScenarioInsertion = async () => {
    try {
      if (!ruleContent) return;
      const updatedJSON = await createRuleJSONWithScenarios(jsonFilename, ruleContent);
      return downloadJSON(updatedJSON, jsonFilename);
    } catch (error: any) {
      logError("Error fetching JSON:", error);
      throw error;
    }
  };

  const handleFileUpload = useCallback(
    async (_event: any, uploadedContent: { tests?: any[] }) => {
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
    },
    [jsonFilename, updateScenarios]
  );

  useEffect(() => {
    const handleFileSelect = (event: any) => {
      if (
        decisionGraphRef.current &&
        event.target?.accept === "application/json" &&
        event.target.type === "file" &&
        event.target.files.length > 0
      ) {
        const file = event.target.files[0];
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

    document.addEventListener("change", handleFileSelect, true);
    document.addEventListener("click", interceptJSONDownload);

    return () => {
      document.removeEventListener("change", handleFileSelect, true);
      document.removeEventListener("click", interceptJSONDownload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionGraphRef, handleFileUpload]);
};

const getRuleIdFromPath = () => {
  const match = window.location.pathname.match(/\/rule\/([^/]+)/);
  return match?.[1] ?? null;
};
