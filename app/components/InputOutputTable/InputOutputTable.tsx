import { useState, useEffect } from "react";
import { Table, Tag } from "antd";
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
}

export default function InputOutputTable({ title, rawData }: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);

  const convertAndStyleValue = (value: any, property: string) => {
    // Handle booleans
    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }
    // Handle money amounts
    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      value = `$${value}`;
    }
    return <b>{value}</b>;
  };

  useEffect(() => {
    if (rawData) {
      const newData: object[] = [];
      Object.entries(rawData).forEach(([property, value], index) => {
        if (!PROPERTIES_TO_IGNORE.includes(property)) {
          newData.push({
            property,
            value: convertAndStyleValue(value, property),
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
