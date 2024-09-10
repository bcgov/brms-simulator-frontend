import { useState, useEffect, FocusEvent } from "react";
import { Table, Tag, Input, Button, Tooltip, Flex } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { RuleMap } from "@/app/types/rulemap";
import styles from "./InputOutputTable.module.css";
import { dollarFormat } from "@/app/utils/utils";

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
  schemaContext?: Record<string, any>;
}

export default function InputOutputTable({
  title,
  rawData,
  setRawData,
  submitButtonRef,
  editable = false,
  rulemap,
  schemaContext,
}: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const handleClear = (property: any) => {
    const inputElement = document.getElementById(property) as any;

    if (inputElement) {
      inputElement.value = null;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    handleValueChange(null, property);
  };

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    if (editable) {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <Input
              id={property}
              value={value ?? null}
              onChange={(e) => handleInputChange(e, property)}
              defaultValue={value ?? ""}
              onBlur={(e) => handleValueChange(e, property)}
              onKeyDown={(e) => handleKeyDown(e)}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleClear(property)}
              />
            </Tooltip>
          </Flex>
          <span className="label-text">{property}</span>
        </label>
      );
    }

    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    if (typeof value === "number" && property.toLowerCase().includes("amount")) {
      const formattedValue = dollarFormat(value);
      return <Tag color="green">${formattedValue}</Tag>;
    }

    return <b>{value}</b>;
  };

  const handleValueChange = (
    e: FocusEvent<HTMLInputElement, Element> | React.ChangeEvent<HTMLInputElement> | null,
    property: string
  ) => {
    const newValue = e?.target?.value || null;
    let queryValue: any = newValue;

    if (newValue?.toLowerCase() === "true") {
      queryValue = true;
    } else if (newValue?.toLowerCase() === "false") {
      queryValue = false;
    } else if (newValue && !isNaN(Number(newValue))) {
      queryValue = Number(newValue);
    }

    const updatedData = { ...rawData, [property]: queryValue };

    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      console.error("setRawData is not a function or is undefined");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | null, property: string) => {
    const newValue = e?.target?.value || "";
    const updatedData = { ...rawData, [property]: newValue };

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
