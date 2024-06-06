import { useState, useEffect, FocusEvent } from "react";
import { Table, Tag, Input } from "antd";
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

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry"];

interface InputOutputTableProps {
  title: string;
  rawData: object;
  setRawData?: (data: object) => void;
}

export default function InputOutputTable({ title, rawData, setRawData }: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    let displayValue = value;

    // Convert booleans and numbers to strings for the input field if editable
    if (editable) {
      if (typeof value === "boolean") {
        displayValue = value.toString();
      } else if (typeof value === "number") {
        displayValue = value.toString();
      }
      return <Input defaultValue={displayValue} onBlur={(e) => handleValueChange(e, property)} />;
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    // Handle money amounts
    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      displayValue = `$${value}`;
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

  useEffect(() => {
    if (rawData) {
      const newData: object[] = [];
      Object.entries(rawData).forEach(([property, value], index) => {
        if (!PROPERTIES_TO_IGNORE.includes(property)) {
          newData.push({
            property,
            value: convertAndStyleValue(value, property, true),
            key: index,
          });
        }
      });
      setDataSource(newData);
    }
  }, [rawData]);

  return (
    <div>
      <h4 className={styles.tableTitle}>{title}</h4>
      <Table
        columns={COLUMNS}
        showHeader={false}
        dataSource={dataSource}
        bordered
        pagination={{ hideOnSinglePage: true }}
      />
    </div>
  );
}
