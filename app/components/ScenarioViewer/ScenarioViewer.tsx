"use client";
import React, { useState, useEffect, useRef, use } from "react";
import { Flex, Button, Popconfirm, message } from "antd";
import type { PopconfirmProps } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import InputOutputTable from "../InputOutputTable";
import styles from "./ScenarioViewer.module.css";
import { Scenario } from "@/app/types/scenario";
import { deleteScenario } from "@/app/utils/api";
import ScenarioFormatter from "../ScenarioFormatter";

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
  const [manageScenarios, setManageScenarios] = useState(false);
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

  const handleDeleteScenario = async (scenario: Scenario) => {
    const scenarioID = scenario._id || "";
    try {
      await deleteScenario(scenarioID);
      scenariosDisplay ? setScenariosDisplay(scenariosDisplay.filter((s) => s._id !== scenarioID)) : null;
      message.success("Scenario deleted");
      setManageScenarios(false);
    } catch (e) {
      message.error("Error deleting scenario");
    }
  };

  const cancel: PopconfirmProps["onCancel"] = (e) => {
    console.log(e);
  };

  return (
    <Flex className={styles.scenarioViewer}>
      <Flex className={styles.scenarioList} vertical>
        {scenariosDisplay && scenariosDisplay.length > 0 ? (
          <>
            <ol>
              {scenariosDisplay.map((scenario, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectScenario(scenario)}
                  className={selectedScenario === scenario ? styles.selected : ""}
                >
                  {scenario.title} {"  "}
                  {manageScenarios && (
                    <>
                      <Popconfirm
                        title="Are you sure you want to delete this scenario?"
                        onConfirm={() => handleDeleteScenario(scenario)}
                        onCancel={cancel}
                        okText="Yes, delete scenario"
                        cancelText="No"
                      >
                        <Button
                          shape="circle"
                          icon={<DeleteOutlined />}
                          disabled={!manageScenarios}
                          size="small"
                          danger
                        ></Button>
                      </Popconfirm>
                    </>
                  )}
                </li>
              ))}
            </ol>
            <Button onClick={() => setManageScenarios(!manageScenarios)}>Manage Scenarios</Button>
          </>
        ) : (
          <div>No scenarios available</div>
        )}
      </Flex>
      {selectedScenario && (
        <Flex vertical gap={"small"} className={styles.selectedScenarioDetails}>
          <Flex vertical gap={"small"} className={styles.scenarioDetails}>
            <div className={styles.variablesTable}>
              {/* <InputOutputTable
                title="Inputs"
                rawData={selectedScenario.variables.reduce((acc, variable) => {
                  acc[variable.name] = variable.value;
                  return acc;
                }, {} as Record<string, any>)}
              /> */}
              <ScenarioFormatter
                title="Inputs"
                scenarios={scenarios}
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
