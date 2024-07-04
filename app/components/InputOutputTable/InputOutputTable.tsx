import { useState, useEffect, FocusEvent } from "react";
import { Table, Tag, Input, Button } from "antd";
import { RuleMap } from "@/app/types/rulemap";
import styles from "./InputOutputTable.module.css";

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
  [key: string]: any;
}

interface InputOutputTableProps {
  title: string;
  rawData: rawDataProps | null | undefined;
  setRawData?: (data: rawDataProps) => void;
  submitButtonRef?: React.RefObject<HTMLButtonElement>;
  editable?: boolean;
  rulemap?: RuleMap;
}

export default function InputOutputTable({
  title,
  rawData,
  setRawData,
  submitButtonRef,
  editable = false,
  rulemap,
}: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    if (editable) {
      return (
        <label className="labelsmall">
          <Input
            defaultValue={value}
            onBlur={(e) => handleValueChange(e, property)}
            onKeyDown={(e) => handleKeyDown(e)}
          />
          <span className="label-text">{property}</span>
        </label>
      );
    }

    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      return `$${value}`;
    }

    return <b>{value}</b>;
  };

  const handleValueChange = (e: FocusEvent<HTMLInputElement, Element>, property: string) => {
    if (!e.target) return;
    const newValue = (e.target as HTMLInputElement).value;
    let queryValue: any = newValue;

    if (newValue.toLowerCase() === "true") {
      queryValue = true;
    } else if (newValue.toLowerCase() === "false") {
      queryValue = false;
    } else if (!isNaN(Number(newValue))) {
      queryValue = Number(newValue);
    }

    const updatedData = { ...rawData, [property]: queryValue } || {};

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

  useEffect(() => {
    if (rawData) {
      const propertyRuleMap = Object.values(rulemap || {}).flat();
      const newData = Object.entries(rawData)
        .filter(([property]) => !PROPERTIES_TO_IGNORE.includes(property))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([property, value], index) => ({
          property: propertyRuleMap?.find((item) => item.property === property)?.name || property,
          value: convertAndStyleValue(value, property, editable),
          key: index,
        }));
      setDataSource(newData);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
      </h4>
      {showTable && (
        <Table
          columns={columns}
          showHeader={false}
          dataSource={dataSource}
          bordered
          pagination={{ hideOnSinglePage: true }}
        />
      )}
    </div>
  );
}
