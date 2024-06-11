import { useState, useEffect, FocusEvent } from "react";
import { Table, Tag, Input, Button } from "antd";
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
  submitButtonRef?: React.RefObject<HTMLButtonElement>;
}

export default function InputOutputTable({ title, rawData, setRawData, submitButtonRef }: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

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

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
      </h4>
      {showTable && (
        <>
          <Table
            columns={columns}
            showHeader={false}
            dataSource={dataSource}
            bordered
            pagination={{ hideOnSinglePage: true }}
          />
        </>
      )}
    </div>
  );
}
