"use client";
import React, { useState, useEffect, useRef } from "react";
import { Flex, Button, Input } from "antd";
import InputOutputTable from "../InputOutputTable";
import styles from "./ScenarioGenerator.module.css";
import { Scenario } from "@/app/types/scenario";
import { SubmissionData } from "@/app/types/submission";
import { createScenario } from "@/app/utils/api";

interface ScenarioGeneratorProps {
  scenarios: Scenario[];
  resultsOfSimulation: Record<string, any> | null | undefined;
  setSelectedSubmissionInputs: (data: any) => void;
  runSimulation: () => void;
  simulateButtonRef: React.RefObject<HTMLButtonElement>;
  selectedSubmissionInputs: SubmissionData;
  outputSchema: Record<string, any> | null;
  setOutputSchema: (data: any) => void;
  resetTrigger: boolean;
  ruleId: string;
  jsonFile: string;
}

export default function ScenarioGenerator({
  scenarios,
  resultsOfSimulation,
  setSelectedSubmissionInputs,
  runSimulation,
  simulateButtonRef,
  selectedSubmissionInputs,
  outputSchema,
  setOutputSchema,
  resetTrigger,
  ruleId,
  jsonFile,
}: ScenarioGeneratorProps) {
  const [simulationRun, setSimulationRun] = useState(false);
  const [isInputsValid, setIsInputsValid] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");

  const handleSaveScenario = async () => {
    if (!simulationRun || !selectedSubmissionInputs || !newScenarioName) return;

    const variables = Object.entries(selectedSubmissionInputs)
      .filter(([name, value]) => name !== "rulemap")
      .map(([name, value]) => ({ name, value }));

    const newScenario: Scenario = {
      title: newScenarioName,
      ruleID: ruleId,
      goRulesJSONFilename: jsonFile,
      variables,
    };

    try {
      await createScenario(newScenario);
      console.log("Scenario created successfully!");
      setNewScenarioName("");
    } catch (error) {
      console.error("Error creating scenario:", error);
    }
  };

  const runScenarioSimulation = () => {
    if (!selectedSubmissionInputs) return;

    runSimulation();
    setSimulationRun(true);
  };

  const validateInputs = (inputs: object) => {
    return Object.values(inputs).every((value) => value !== null && value !== undefined);
  };

  useEffect(() => {
    setIsInputsValid(validateInputs(selectedSubmissionInputs));
  }, [selectedSubmissionInputs]);

  useEffect(() => {
    setSimulationRun(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return (
    <Flex className={styles.ScenarioGenerator}>
      <Flex gap="middle">
        {selectedSubmissionInputs && (
          <Flex vertical gap={"small"} align="end" className={styles.inputSection}>
            <InputOutputTable
              title="Inputs"
              rawData={selectedSubmissionInputs}
              setRawData={(data) => {
                setSelectedSubmissionInputs(data);
                setIsInputsValid(validateInputs(data));
              }}
              submitButtonRef={simulateButtonRef}
            />
            <Flex gap={"small"} align="end" vertical>
              <Button
                disabled={!isInputsValid}
                ref={simulateButtonRef}
                size="large"
                type="primary"
                onClick={runScenarioSimulation}
              >
                Simulate ▶
              </Button>
              <Flex gap={"small"} align="end">
                {simulationRun && (
                  <>
                    <Input
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="Enter Scenario Name"
                    />
                    <Button disabled={!newScenarioName} size="large" type="primary" onClick={handleSaveScenario}>
                      Save Scenario ⬇️
                    </Button>
                  </>
                )}
              </Flex>
            </Flex>
          </Flex>
        )}
        <Flex gap={"small"}>
          {outputSchema && <InputOutputTable title="Outputs" rawData={outputSchema} setRawData={setOutputSchema} />}
        </Flex>
        <Flex gap={"small"} vertical>
          {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} />}
        </Flex>
      </Flex>
    </Flex>
  );
}
