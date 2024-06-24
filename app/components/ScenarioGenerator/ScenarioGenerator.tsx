import React, { useState, useEffect } from "react";
import { Flex, Button, Input } from "antd";
import InputOutputTable from "../InputOutputTable";
import styles from "./ScenarioGenerator.module.css";
import { Scenario } from "@/app/types/scenario";
import { SubmissionData } from "@/app/types/submission";
import { createScenario } from "@/app/utils/api";
import ScenarioFormatter from "../ScenarioFormatter";

interface ScenarioGeneratorProps {
  scenarios: Scenario[];
  resultsOfSimulation: Record<string, any> | null | undefined;
  setSelectedSubmissionInputs: (data: any) => void;
  runSimulation: () => void;
  selectedSubmissionInputs: SubmissionData;
  resetTrigger: boolean;
  ruleId: string;
  jsonFile: string;
}

export default function ScenarioGenerator({
  scenarios,
  resultsOfSimulation,
  setSelectedSubmissionInputs,
  runSimulation,
  selectedSubmissionInputs,
  resetTrigger,
  ruleId,
  jsonFile,
}: ScenarioGeneratorProps) {
  const [simulationRun, setSimulationRun] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [scenarioExpectedOutput, setScenarioExpectedOutput] = useState({});

  const handleSaveScenario = async () => {
    if (!simulationRun || !selectedSubmissionInputs || !newScenarioName) return;

    const variables = Object.entries(selectedSubmissionInputs)
      .filter(([name, value]) => name !== "rulemap" && value !== null && value !== undefined)
      .map(([name, value]) => ({ name, value }));

    const expectedResults = Object.entries(scenarioExpectedOutput)
      .filter(([name, value]) => name !== "rulemap" && value !== null && value !== undefined)
      .map(([name, value]) => ({ name, value }));

    const newScenario: Scenario = {
      title: newScenarioName,
      ruleID: ruleId,
      goRulesJSONFilename: jsonFile,
      variables,
      expectedResults,
    };

    try {
      await createScenario(newScenario);
      setNewScenarioName("");
      // Reload the page after the scenario is successfully created
      window.location.reload();
    } catch (error) {
      console.error("Error creating scenario:", error);
    }
  };

  const runScenarioSimulation = () => {
    if (!selectedSubmissionInputs) return;
    runSimulation();
    setSimulationRun(true);
  };

  useEffect(() => {
    setSimulationRun(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Update scenarioExpectedOutput on first render to display full rulemap possible results
  useEffect(() => {
    if (resultsOfSimulation) {
      setScenarioExpectedOutput(resultsOfSimulation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex className={styles.ScenarioGenerator}>
      <Flex gap="middle">
        {selectedSubmissionInputs && (
          <Flex vertical gap={"small"} align="end" className={styles.inputSection}>
            <ScenarioFormatter
              title="Inputs"
              rawData={selectedSubmissionInputs}
              setRawData={(data) => {
                setSelectedSubmissionInputs(data);
              }}
              scenarios={scenarios}
            />
            <Flex gap={"small"} align="end" vertical>
              <Button size="large" type="primary" onClick={runScenarioSimulation}>
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
        <Flex gap={"small"} vertical>
          {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} />}
        </Flex>
        <Flex gap={"small"} vertical>
          {scenarioExpectedOutput && (
            <InputOutputTable
              setRawData={(data) => {
                setScenarioExpectedOutput(data);
              }}
              title="Expected Results"
              rawData={scenarioExpectedOutput}
              editable
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
