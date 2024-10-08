import React, { useState, useEffect } from "react";
import { Flex, Button, message, InputNumber, Collapse } from "antd";
import { Scenario } from "@/app/types/scenario";
import { getCSVTests } from "@/app/utils/api";
import { RuleMap } from "@/app/types/rulemap";
import ScenarioFormatter from "../ScenarioFormatter";
import styles from "./IsolationTester.module.css";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { valueType } from "antd/es/statistic/utils";

interface IsolationTesterProps {
  scenarios: Scenario[];
  simulationContext?: Record<string, any>;
  setSimulationContext: (data: any) => void;
  resetTrigger: boolean;
  jsonFile: string;
  rulemap: RuleMap;
  ruleContent?: DecisionGraphType;
  ruleVersion?: string | boolean;
}

export default function IsolationTester({
  scenarios,
  simulationContext,
  setSimulationContext,
  resetTrigger,
  jsonFile,
  rulemap,
  ruleContent,
  ruleVersion,
}: IsolationTesterProps) {
  const [testScenarioCount, setTestScenarioCount] = useState<valueType | null>(10);

  const handleCSVTests = async () => {
    const ruleName = ruleVersion === "draft" ? "Draft" : ruleVersion === "inreview" ? "In Review" : "Published";
    try {
      const csvContent = await getCSVTests(jsonFile, ruleName, ruleContent, simulationContext, testScenarioCount);
      message.success(`Scenario Tests: ${csvContent}`);
    } catch (error) {
      message.error("Error downloading scenarios.");
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const editScenario = { ...simulationContext, rulemap: true };
    setSimulationContext(editScenario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return (
    <Flex gap={"small"}>
      <div>
        <Flex gap={"small"}>
          <ol className={styles.instructionsList}>
            <li>
              This tab allows you to test your rule by defining specific variables you would like to remain unchanged
              while generating possible scenarios that combine the possibilities of the other variables you leave blank.
            </li>
            <li>
              Define any variables you would like to remain unchanged. The more that you define, the more specific the
              tests will be.
              <Collapse
                items={[
                  {
                    key: "1",
                    label: "Input Variables",
                    children: (
                      <Flex gap="middle" className={styles.IsolationTester}>
                        {simulationContext && (
                          <Flex gap={"small"} align="end">
                            <ScenarioFormatter
                              title="Inputs"
                              rawData={simulationContext}
                              setRawData={(data) => setSimulationContext(data)}
                              scenarios={scenarios}
                              rulemap={rulemap}
                            />
                          </Flex>
                        )}
                      </Flex>
                    ),
                  },
                ]}
              />
            </li>
            <li>
              {" "}
              Any undefined variables will be randomly generated based on the validation values defined in klamm for
              these inputs.
            </li>
            <li>
              Enter the maximum number of scenarios you would like to generate (there is a maximum of 1000):{" "}
              <InputNumber
                value={testScenarioCount}
                onChange={(value) => setTestScenarioCount(value)}
                changeOnBlur
                defaultValue={10}
                min={1}
                max={1000}
              />
            </li>
            <li>
              Generate a CSV file with your created tests:{" "}
              <Button onClick={handleCSVTests} size="large" type="primary">
                Generate Tests
              </Button>
            </li>
          </ol>
        </Flex>
      </div>
    </Flex>
  );
}
