import { useState, useEffect, useRef } from "react";
import { Table, Tag, Button, TableProps, Flex, message, List } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, RightCircleOutlined, DownCircleOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import styles from "./ScenarioTester.module.css";
import { runDecisionsForScenarios } from "@/app/utils/api";
import useResponsiveSize from "../../hooks/ScreenSizeHandler";
interface ScenarioTesterProps {
  jsonFile: string;
  ruleContent?: DecisionGraphType;
  uploader?: boolean;
}

export default function ScenarioTester({ jsonFile, ruleContent }: ScenarioTesterProps) {
  const [scenarioResults, setScenarioResults] = useState<any | null>({});
  const hasError = useRef(false);
  const { isMobile, isTablet } = useResponsiveSize();

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
      displayValue = `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
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
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <a>{text}</a>,
        fixed: "left",
        width: "10%",
      },
      {
        title: "Inputs",
        children: inputColumns,
        responsive: ["lg", "xl", "xxl"],
      },
      {
        title: "Results",
        children: outputColumns,
        responsive: ["lg", "xl", "xxl"],
      },
    ];

    return { formattedData, columns };
  };

  const expandedRowRender = (record: { name: string }, displayExpanded: boolean) => {
    const expandedData = Object.entries(record || {}).map(([property, value], index) => ({
      key: index.toString(),
      property,
      value,
    }));
    const filteredExpected = displayExpanded
      ? expandedData
      : expandedData.filter((entry) => entry.property.includes("expected_result"));

    const expandedDataColumns = filteredExpected.map((entry) => ({
      title: displayExpanded ? entry.property : entry.property.replace("expected_result_", ""),
      dataIndex: entry.property,
      key: entry.property,
      value: applyConditionalStyling(entry.value, entry.property),
    }));

    return (
      <div className={styles.expectedResultsExpanded}>
        <Flex gap="small" vertical>
          {!displayExpanded ? <span>Expected results for scenario: {record?.name}</span> : null}
          <List
            dataSource={expandedDataColumns}
            renderItem={(item) => (
              <>
                {item.title === "key" ? null : (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={item.value} />
                  </List.Item>
                )}
              </>
            )}
          />
        </Flex>
      </div>
    );
  };

  const rowExpandable = (record: { resultMatch: { props: { className: string } } }) => {
    if (isMobile || isTablet) {
      return true;
    }
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

  return (
    <div>
      <div className={styles.scenarioContainer}>
        <Flex gap={"small"} justify="space-between">
          <Button onClick={() => updateScenarioResults(jsonFile)} size="large" type="primary">
            Run Scenarios
          </Button>
        </Flex>
        <Flex gap="small" vertical>
          <Table
            pagination={{ hideOnSinglePage: true, size: "small", pageSize: 10 }}
            bordered
            dataSource={scenarioResults.formattedData}
            columns={scenarioResults.columns}
            expandable={{
              expandedRowRender: (record: any) => expandedRowRender(record, isMobile || isTablet),
              rowExpandable: (record: any) => rowExpandable(record),
              columnTitle: isMobile || isTablet ? "Expand Record" : "Status",
              columnWidth: "10%",
              expandIcon: ({ expanded, onExpand, record }) =>
                record.resultMatch.props.className !== "result-mismatch" ? (
                  rowExpandable(record) ? (
                    <Button onClick={(e) => onExpand(record, e)} aria-label="view record" size="small" type="text">
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        {expanded ? <DownCircleOutlined /> : <RightCircleOutlined />}
                      </Tag>
                    </Button>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} />
                  )
                ) : (
                  <Button
                    onClick={(e) => onExpand(record, e)}
                    aria-label="view expected results"
                    size="small"
                    type="text"
                  >
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      {expanded ? <DownCircleOutlined /> : <RightCircleOutlined />}
                    </Tag>
                  </Button>
                ),
            }}
            className={styles.scenarioTable}
            size="small"
            scroll={{ x: isMobile || isTablet ? 400 : 800, y: 600 }}
            virtual
          />
        </Flex>
      </div>
    </div>
  );
}
