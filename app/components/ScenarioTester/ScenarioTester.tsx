import { useState, useEffect, FocusEvent, use } from "react";
import { Table, Tag, Input, Button, TableProps, Flex, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./ScenarioTester.module.css";
import { runDecisionsForScenarios, uploadCSVAndProcess } from "@/app/utils/api";

const COLUMNS = [
  {
    title: "Property",
    dataIndex: "property",
    key: "property",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
  },
];

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry", "rulemap"];

interface rawDataProps {
  rulemap?: boolean;
}

interface ScenarioTesterProps {
  jsonFile: string;
}

export default function ScenarioTester({ jsonFile }: ScenarioTesterProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);
  const [scenarioResults, setScenarioResults] = useState<any | null>({});
  const [file, setFile] = useState<File | null>(null);

  type DataType = {
    key: string;
    name: string;
    [key: string]: any;
  };

  const formatData = (data: any): { formattedData: DataType[]; columns: TableProps<DataType>["columns"] } => {
    const uniqueInputKeys = new Set<string>();
    const uniqueOutputKeys = new Set<string>();

    // Collect unique input and output keys
    for (const entry of Object.values(data)) {
      Object.keys(entry.inputs).forEach((key) => uniqueInputKeys.add(key));
      Object.keys(entry.outputs).forEach((key) => uniqueOutputKeys.add(key));
    }

    const sortKeys = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b));

    // Convert sets to arrays for easier iteration
    const inputKeys = sortKeys(Array.from(uniqueInputKeys));
    const outputKeys = sortKeys(Array.from(uniqueOutputKeys));

    const applyConditionalStyling = (value: any, property: string): React.ReactNode => {
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return null;
      }

      // Handle booleans
      if (typeof value === "boolean") {
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
      outputKeys.forEach((key) => {
        formattedEntry[`output_${key}`] =
          entry.outputs[key] !== undefined ? applyConditionalStyling(entry.outputs[key], key) : null;
      });

      return formattedEntry;
    });

    const generateColumns = (keys: string[], prefix: string) => {
      return keys.map((key) => ({
        title: key,
        dataIndex: `${prefix.toLowerCase()}_${key}`,
        key: `${prefix.toLowerCase()}_${key}`,
        render: (value) => applyConditionalStyling(value, key),
      }));
    };

    const inputColumns = generateColumns(inputKeys, "input");
    const outputColumns = generateColumns(outputKeys, "output");

    const columns: TableProps<DataType>["columns"] = [
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
        title: "Outputs",
        children: outputColumns,
      },
    ];

    return { formattedData, columns };
  };

  const updateScenarioResults = async (goRulesJSONFilename: string) => {
    try {
      const results = await runDecisionsForScenarios(goRulesJSONFilename);
      const formattedResults = formatData(results);
      setScenarioResults(formattedResults);
    } catch (error) {
      console.error("Error fetching scenario results:", error);
    }
  };

  useEffect(() => {
    updateScenarioResults(jsonFile);
  }, [jsonFile]);
  /*
  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    let displayValue = value;

    if (editable) {
      return (
        <Input
          defaultValue={displayValue}
          onBlur={(e) => handleValueChange(e, property)}
          onKeyDown={(e) => handleKeyDown(e)}
        />
      );
    }

    // Custom formatting for non-editable booleans and numbers
    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }
    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      displayValue = `$${value}`;
    }

    if (value === null || value === undefined) {
      return;
    }

    return <b>{displayValue}</b>;
  };

  const handleValueChange = (e: FocusEvent<HTMLInputElement, Element>, property: string) => {
    if (!e.target) return;
    const newValue = (e.target as HTMLInputElement).value;
    let queryValue: any = newValue;

    // Handle booleans
    if (newValue.toLowerCase() === "true") {
      queryValue = true;
    } else if (newValue.toLowerCase() === "false") {
      queryValue = false;
    }

    // Handle numbers
    if (!isNaN(Number(newValue))) {
      queryValue = Number(newValue);
    }

    const updatedData = { ...rawData, [property]: queryValue } || {};

    // Ensure setRawData is defined before calling it
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      console.error("setRawData is not a function or is undefined");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && submitButtonRef) {
      if (submitButtonRef.current) {
        submitButtonRef.current.click();
      }
    }
  };

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  useEffect(() => {
    if (rawData) {
      const editable = title === "Inputs" && rawData.rulemap === true;
      const newData = Object.entries(rawData)
        .filter(([property]) => !PROPERTIES_TO_IGNORE.includes(property))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([property, value], index) => ({
          property,
          value: convertAndStyleValue(value, property, editable),
          key: index,
        }));
      setDataSource(newData);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);
*/

  const handleUpload = (info: any) => {
    setFile(info.file.originFileObj);
    message.success(`${info.file.name} file uploaded successfully.`);
    console.log("File uploaded:", info.file.originFileObj);
  };

  const handleRunUploadScenarios = async () => {
    if (!file) {
      message.error("No file uploaded.");
      return;
    }

    try {
      console.log("Uploading file");
      const csvContent = await uploadCSVAndProcess(file, jsonFile);
      message.success("Scenarios processed successfully.");
      console.log("Processed CSV content:", csvContent);
    } catch (error) {
      message.error("Error processing scenarios.");
      console.error("Error:", error);
    }
  };

  return (
    <div>
      {showTable && (
        <>
          <Flex gap={"small"} justify="space-between">
            <Button onClick={() => updateScenarioResults(jsonFile)} size="large" type="primary">
              Run Scenarios
            </Button>
            <Flex gap={"small"} vertical>
              <a href={`/api/scenario/evaluation/${encodeURIComponent(jsonFile)}`}>Download Scenarios</a>
              <Upload
                customRequest={({ file, onSuccess }) => {
                  setFile(file as File);
                  message.success(`${(file as File).name} file uploaded successfully.`);
                  onSuccess && onSuccess("ok");
                }}
                showUploadList={false}
              >
                <Button size="large" type="primary" icon={<UploadOutlined />}>
                  Upload Scenarios
                </Button>
              </Upload>
              <Button size="large" type="primary" onClick={handleRunUploadScenarios} style={{ marginLeft: "10px" }}>
                Run Upload Scenarios
              </Button>
            </Flex>
          </Flex>
          <Flex gap="small" vertical>
            <Table
              pagination={{ hideOnSinglePage: true }}
              bordered
              dataSource={scenarioResults.formattedData}
              columns={scenarioResults.columns}
            />
          </Flex>
        </>
      )}
    </div>
  );
}
