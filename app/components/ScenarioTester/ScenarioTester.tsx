import { useState, useEffect, useRef } from "react";
import { Table, Tag, Button, TableProps, Flex, Upload, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import styles from "./ScenarioTester.module.css";
import { runDecisionsForScenarios, uploadCSVAndProcess, getCSVForRuleRun } from "@/app/utils/api";

interface ScenarioTesterProps {
  jsonFile: string;
  ruleContent?: DecisionGraphType;
  uploader?: boolean;
}

export default function ScenarioTester({ jsonFile, ruleContent, uploader }: ScenarioTesterProps) {
  const [scenarioResults, setScenarioResults] = useState<any | null>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState(false);
  const hasError = useRef(false);

  type DataType = {
    key: string;
    name: string;
    [key: string]: any;
  };

  const applyConditionalStyling = (value: any, property: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "boolean" && property === "resultMatch") {
      return value ? (
        <span className="result-match">
          <Tag color="success" icon={<CheckCircleOutlined />}></Tag>
        </span>
      ) : (
        <span className="result-mismatch">
          <Tag color="error" icon={<CloseCircleOutlined />}></Tag>
        </span>
      );
    } else if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    // Handle numbers with "amount" in the property name
    let displayValue = value;
    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      displayValue = `$${value}`;
    } else if (typeof value === "number") {
      displayValue = <Tag color="blue">{value}</Tag>;
    }

    // Default formatting for other values
    return <b>{displayValue}</b>;
  };

  const generateColumns = (keys: string[], prefix: string) => {
    return keys.map((key) => ({
      title: key,
      dataIndex: `${prefix.toLowerCase()}_${key}`,
      key: `${prefix.toLowerCase()}_${key}`,
      render: (value: any) => applyConditionalStyling(value, key),
    }));
  };

  const formatData = (
    data: Record<
      string,
      {
        result: Record<string, any>;
        inputs: Record<string, any>;
        outputs: Record<string, any>;
        expectedResults: Record<string, any>;
        resultMatch: boolean;
      }
    >
  ): { formattedData: DataType[]; columns: TableProps<DataType>["columns"] } => {
    const uniqueInputKeys = new Set<string>();
    const uniqueResultKeys = new Set<string>();
    const uniqueExpectedKeys = new Set<string>();

    // Collect unique input and result keys
    for (const entry of Object.values(data)) {
      Object.keys(entry.inputs).forEach((key) => uniqueInputKeys.add(key));
      Object.keys(entry.result).forEach((key) => uniqueResultKeys.add(key));
      Object.keys(entry.expectedResults).forEach((key) => uniqueExpectedKeys.add(key));
    }

    const sortKeys = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b));

    // Convert sets to arrays for easier iteration
    const inputKeys = sortKeys(Array.from(uniqueInputKeys));
    const resultKeys = sortKeys(Array.from(uniqueResultKeys));
    const expectedKeys = sortKeys(Array.from(uniqueExpectedKeys));

    // Format the data
    const formattedData: DataType[] = Object.entries(data).map(([name, entry], index) => {
      const formattedEntry: DataType = {
        key: (index + 1).toString(),
        name,
      };

      // Add inputs
      inputKeys.forEach((key) => {
        formattedEntry[`input_${key}`] =
          entry.inputs[key] !== undefined ? applyConditionalStyling(entry.inputs[key], key) : null;
      });

      // Add outputs
      resultKeys.forEach((key) => {
        formattedEntry[`result_${key}`] =
          entry.result[key] !== undefined ? applyConditionalStyling(entry.result[key], key) : null;
      });

      // Add expected results
      expectedKeys.forEach((key) => {
        formattedEntry[`expected_result_${key}`] =
          entry.expectedResults[key] !== undefined ? applyConditionalStyling(entry.expectedResults[key], key) : null;
      });

      formattedEntry.resultMatch = applyConditionalStyling(entry.resultMatch, "resultMatch");

      return formattedEntry;
    });

    const inputColumns = generateColumns(inputKeys, "input");
    const outputColumns = generateColumns(resultKeys, "result");
    //Unused columns for now, unless we'd like to display the expected results as columns on the frontend
    const expectedColumns = generateColumns(expectedKeys, "expected_result");

    const columns: TableProps<DataType>["columns"] = [
      {
        title: "Status",
        dataIndex: "resultMatch",
        key: "resultMatch",
        fixed: "left",
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <a>{text}</a>,
        fixed: "left",
      },
      {
        title: "Inputs",
        children: inputColumns,
      },
      {
        title: "Results",
        children: outputColumns,
      },
    ];

    return { formattedData, columns };
  };

  const expandedRowRender = (record: { name: string }) => {
    const expandedData = Object.entries(record || {})
      .map(([property, value], index) => ({
        key: index.toString(),
        property,
        value,
      }))
      .filter((entry) => entry.property.includes("expected_result"));
    const expandedDataColumns = expandedData.map((entry) => ({
      title: entry.property.replace("expected_result_", ""),
      dataIndex: entry.property,
      key: entry.property,
      render: (value: any) => {
        return applyConditionalStyling(value, entry.property);
      },
    }));

    return (
      <div className={styles.expectedResultsExpanded}>
        <Flex gap="small">
          <Table
            title={() => `Expected results for scenario: ${record?.name}`}
            columns={expandedDataColumns}
            dataSource={[record]}
            pagination={false}
            bordered
          />
        </Flex>
      </div>
    );
  };

  const rowExpandable = (record: { resultMatch: { props: { className: string } } }) => {
    const resultStatus = record.resultMatch.props.className === "result-mismatch" ? true : false;
    return resultStatus;
  };

  const updateScenarioResults = async (goRulesJSONFilename: string) => {
    try {
      const results = await runDecisionsForScenarios(goRulesJSONFilename, ruleContent);
      // Loop through object and check if data.result is an array
      for (const key in results) {
        if (Array.isArray(results[key].result)) {
          throw new Error(
            `Error with results for: ${key}. Please update your rule and ensure that outputs are on one line.`
          );
        }
      }
      const formattedResults = formatData(results);
      setScenarioResults(formattedResults);
    } catch (error) {
      if (!hasError.current) {
        hasError.current = true;
        message.error("Error fetching scenario results: " + error);
      }
    }
  };

  useEffect(() => {
    hasError.current = false;
    updateScenarioResults(jsonFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonFile]);

  const handleRunUploadScenarios = async () => {
    if (!file) {
      message.error("No file uploaded.");
      return;
    }
    try {
      const csvContent = await uploadCSVAndProcess(file, jsonFile, ruleContent);
      message.success(`Scenarios Test: ${csvContent}`);
    } catch (error) {
      message.error("Error processing scenarios.");
      console.error("Error:", error);
    }
  };

  const handleDownloadScenarios = async () => {
    try {
      const csvContent = await getCSVForRuleRun(jsonFile, ruleContent);
      message.success(`Scenario Testing Template: ${csvContent}`);
    } catch (error) {
      message.error("Error downloading scenarios.");
      console.error("Error:", error);
    }
  };

  return (
    <div>
      {uploader ? (
        <Flex gap={"small"}>
          <ol className={styles.instructionsList}>
            <li>
              Download a template CSV file:{" "}
              <Button onClick={handleDownloadScenarios} size="large" type="primary">
                Generate Scenarios/Template
              </Button>
            </li>
            <li>Add additional scenarios to the CSV file</li>
            <li>
              Upload your edited CSV file with scenarios:{" "}
              <label className="labelsmall">
                <Upload
                  accept=".csv"
                  multiple={false}
                  maxCount={1}
                  customRequest={({ file, onSuccess }) => {
                    setFile(file as File);
                    message.success(`${(file as File).name} file uploaded successfully.`);
                    onSuccess && onSuccess("ok");
                    setUploadedFile(true);
                  }}
                  onRemove={() => {
                    setFile(null);
                    setUploadedFile(false);
                  }}
                  showUploadList={true}
                  className={styles.upload}
                >
                  <Button size="large" type="primary" icon={<UploadOutlined />}>
                    Upload Scenarios
                  </Button>
                </Upload>
                {!file ? `Select file for upload.` : `File Selected.`}
              </label>
            </li>
            <li>
              Run the scenarios against the GO Rules JSON file:{" "}
              <Button
                disabled={!uploadedFile}
                size="large"
                type="primary"
                onClick={handleRunUploadScenarios}
                className="styles.runButton"
              >
                Run Upload Scenarios
              </Button>
            </li>
            <li>Receive a csv file with the results! 🎉</li>
          </ol>
        </Flex>
      ) : (
        <div className={styles.scenarioContainer}>
          <Flex gap={"small"} justify="space-between">
            <Button onClick={() => updateScenarioResults(jsonFile)} size="large" type="primary">
              Run Scenarios
            </Button>
          </Flex>
          <Flex gap="small" vertical>
            <Table
              pagination={{ hideOnSinglePage: true }}
              bordered
              dataSource={scenarioResults.formattedData}
              columns={scenarioResults.columns}
              expandable={{
                expandedRowRender: (record: any) => expandedRowRender(record),
                rowExpandable: (record: any) => rowExpandable(record),
                columnTitle: "View Expected Results",
              }}
              className={styles.scenarioTable}
              size="middle"
            />
          </Flex>
        </div>
      )}
    </div>
  );
}
