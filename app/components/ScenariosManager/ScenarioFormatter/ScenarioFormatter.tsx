import { useState, useEffect } from "react";
import { Table, Button } from "antd";
import { Scenario } from "@/app/types/scenario";
import styles from "./ScenarioFormatter.module.css";
import { RuleMap } from "@/app/types/rulemap";
import InputStyler from "../../InputStyler/InputStyler";
import { parseSchemaTemplate } from "../../InputStyler/ArrayFormatter";

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

interface ScenarioFormatterProps {
  title: string;
  rawData: rawDataProps | null | undefined;
  setRawData?: (data: object) => void;
  scenarios?: Scenario[];
  rulemap: RuleMap;
}

export default function ScenarioFormatter({ title, rawData, setRawData, scenarios, rulemap }: ScenarioFormatterProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  useEffect(() => {
    if (rawData) {
      const editable = title === "Inputs" && rawData.rulemap === true;
      let updatedRawData = rawData;
      if (editable) {
        const ruleMapInputs = rulemap?.inputs.reduce((obj: Record<string, any>, item: any) => {
          obj[item.property] = null;
          return obj;
        }, {});
        updatedRawData = { ...ruleMapInputs, ...rawData };
      }
      const propertyRuleMap = Object.values(rulemap || {}).flat();
      const newData = Object.entries(updatedRawData)
        .filter(([property]) => !PROPERTIES_TO_IGNORE.includes(property))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([property, value], index) => ({
          property:
            propertyRuleMap?.find((item) => item.property === property)?.name ||
            parseSchemaTemplate(property)?.arrayName ||
            property,
          value: InputStyler(value, property, editable, scenarios, updatedRawData, setRawData),
          key: index,
        }));
      // Check if data.result is an array
      if (Array.isArray(rawData)) {
        throw new Error("Please update your rule and ensure that outputs are on one line.");
      }
      setDataSource(newData);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
      </h4>
      {showTable && (
        <Table columns={columns} showHeader={false} dataSource={dataSource} pagination={{ hideOnSinglePage: true }} />
      )}
    </div>
  );
}
