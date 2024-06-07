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

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry", "rulemap"];

interface rawDataProps {
  rulemap?: boolean;
}

interface InputOutputTableProps {
  title: string;
  rawData: rawDataProps;
  setRawData?: (data: object) => void;
}

export default function InputOutputTable({ title, rawData, setRawData }: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    let displayValue = value;

    if (editable) {
      return <Input defaultValue={displayValue} onBlur={(e) => handleValueChange(e, property)} />;
    }

    // Custom formatting for non-editable booleans and numbers
    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
