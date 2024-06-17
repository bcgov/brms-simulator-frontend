"use client";
import React, { useState, useEffect, useRef, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Flex, Button } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import InputOutputTable from "../InputOutputTable";
import styles from "./ScenarioViewer.module.css";
import { Scenario, Variable } from "@/app/types/scenario";

interface ScenarioViewerProps {
  scenarios: Scenario[];
  resultsOfSimulation: Record<string, any> | null | undefined;
  setSelectedSubmissionInputs: (data: any) => void;
  runSimulation: () => void;
}

export default function ScenarioViewer({
  scenarios,
  resultsOfSimulation,
  setSelectedSubmissionInputs,
  runSimulation,
}: ScenarioViewerProps) {
  const [scenariosDisplay, setScenariosDisplay] = useState<Scenario[] | null>(scenarios);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    setScenariosDisplay(scenarios);
  }, [scenarios]);

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    const submissionInputs = scenario.variables.reduce((acc, variable) => {
      acc[variable.name] = variable.value;
      return acc;
    }, {} as Record<string, any>);
    setSelectedSubmissionInputs(submissionInputs);
  };

  const handleRunScenario = () => {
    runSimulation();
  };

  return (
    <Flex className={styles.scenarioViewer}>
      <Flex className={styles.scenarioList}>
        {scenariosDisplay && scenariosDisplay.length > 0 ? (
          <ol>
            {scenariosDisplay.map((scenario, index) => (
              <li
                key={index}
                onClick={() => handleSelectScenario(scenario)}
                className={selectedScenario === scenario ? styles.selected : ""}
              >
                {scenario.title}
              </li>
            ))}
          </ol>
        ) : (
          <div>No scenarios available</div>
        )}
      </Flex>
      {selectedScenario && (
        <Flex vertical gap={"small"} className={styles.selectedScenarioDetails}>
          <Flex vertical gap={"small"} className={styles.scenarioDetails}>
            <div className={styles.variablesTable}>
              <InputOutputTable
                title="Inputs"
                rawData={selectedScenario.variables.reduce((acc, variable) => {
                  acc[variable.name] = variable.value;
                  return acc;
                }, {} as Record<string, any>)}
              />
            </div>
          </Flex>
          <Button size="large" type="primary" onClick={handleRunScenario}>
            Simulate ▶
          </Button>
        </Flex>
      )}

      {!resultsOfSimulation?.rulemap && (
        <>
          <Flex vertical align="center" justify="center">
            <>→</>
          </Flex>
          <Flex className={styles.resultsColumn}>
            <InputOutputTable title="Decision" rawData={resultsOfSimulation} />
          </Flex>
        </>
      )}
    </Flex>
  );
}
