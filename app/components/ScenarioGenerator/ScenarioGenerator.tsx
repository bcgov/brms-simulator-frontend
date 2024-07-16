import React, { useState, useEffect } from "react";
import { Flex, Button, Input } from "antd";
import InputOutputTable from "../InputOutputTable";
import { Scenario } from "@/app/types/scenario";
import { createScenario } from "@/app/utils/api";
import ScenarioFormatter from "../ScenarioFormatter";
import { RuleMap } from "@/app/types/rulemap";
import styles from "./ScenarioGenerator.module.css";

interface ScenarioGeneratorProps {
  scenarios: Scenario[];
  resultsOfSimulation: Record<string, any> | null | undefined;
  simulationContext: Record<string, any>;
  setSimulationContext: (data: any) => void;
  runSimulation: () => void;
  resetTrigger: boolean;
  ruleId: string;
  jsonFile: string;
  rulemap: RuleMap;
  editing?: boolean;
}

export default function ScenarioGenerator({
  scenarios,
  resultsOfSimulation,
  simulationContext,
  setSimulationContext,
  runSimulation,
  resetTrigger,
  ruleId,
  jsonFile,
  rulemap,
  editing = true,
}: ScenarioGeneratorProps) {
  const [simulationRun, setSimulationRun] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [scenarioExpectedOutput, setScenarioExpectedOutput] = useState({});

  const handleSaveScenario = async () => {
    if (!simulationRun || !simulationContext || !newScenarioName) return;

    const variables = Object.entries(simulationContext)
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
    if (!simulationContext) return;
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
    <Flex>
      <Flex gap="middle" className={styles.scenarioGenerator}>
        {simulationContext && (
          <Flex vertical gap={"small"} align="end">
            <ScenarioFormatter
              title="Inputs"
              rawData={simulationContext}
              setRawData={(data) => setSimulationContext(data)}
              scenarios={scenarios}
              rulemap={rulemap}
            />
            <Flex gap={"small"} align="end" vertical>
              <Button size="large" type="primary" onClick={runScenarioSimulation}>
                Simulate ▶
              </Button>
              <Flex gap={"small"} align="end">
                {simulationRun && editing && (
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
          {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} rulemap={rulemap} />}
        </Flex>
        <Flex gap={"small"} vertical>
          {scenarioExpectedOutput && editing && (
            <InputOutputTable
              setRawData={(data) => {
                setScenarioExpectedOutput(data);
              }}
              title="Expected Results"
              rawData={scenarioExpectedOutput}
              editable
              rulemap={rulemap}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
