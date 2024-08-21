import { Tag, Input, Radio, AutoComplete, InputNumber, Flex, Button, Tooltip } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import ArrayFormatter, { parseSchemaTemplate, generateArrayFromSchema } from "./ArrayFormatter";
import { Scenario } from "@/app/types/scenario";

export interface rawDataProps {
  [key: string]: any;
  rulemap?: boolean;
}

export const getAutoCompleteOptions = (property: string, scenarios: Scenario[] = []) => {
  if (!scenarios) return [];
  const optionsSet = new Set<string>();

  scenarios.forEach((scenario) => {
    scenario.variables
      .filter((variable) => variable.name === property)
      .forEach((variable) => optionsSet.add(variable.value));
  });

  return Array.from(optionsSet).map((value) => ({ value, type: typeof value }));
};

export default function InputStyler(
  value: any,
  property: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: rawDataProps | null | undefined,
  setRawData: any
) {
  const handleValueChange = (value: any, property: string) => {
    let queryValue: any = value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") {
        queryValue = true;
      } else if (value.toLowerCase() === "false") {
        queryValue = false;
      } else if (!isNaN(Number(value))) {
        queryValue = Number(value);
      }
    }

    const updatedData = { ...rawData, [property]: queryValue } || {};

    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      console.error("setRawData is not a function or is undefined");
    }
  };

  const handleClear = (property: any) => {
    const inputElement = document.getElementById(property) as any;

    if (inputElement) {
      inputElement.value = null;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    handleValueChange(null, property);
  };

  const handleInputChange = (val: any, property: string) => {
    const updatedData = { ...rawData, [property]: val };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    }
  };

  const valuesArray = getAutoCompleteOptions(property, scenarios);
  let type = typeof value;
  if (valuesArray.length > 0) {
    type = typeof valuesArray[0].value;
  }

  const parsedValue = generateArrayFromSchema(property);
  const parsedSchema = parseSchemaTemplate(property);
  const parsedPropertyName = parsedSchema?.arrayName || property;

  if (editable) {
    if (Array.isArray(parsedValue)) {
      return ArrayFormatter(value, property, editable, scenarios, rawData, setRawData);
    }
    if (typeof value === "object" && value !== null && !Array.isArray(property) && property !== null) {
      return <div>{Object.keys(value).length}</div>;
    }
    if (type === "boolean" || typeof value === "boolean") {
      return (
        <Flex gap={"small"} align="center" vertical>
          <label className="labelsmall">
            <Flex gap={"small"} align="center">
              <Radio.Group onChange={(e) => handleInputChange(e.target.value, property)} value={value}>
                <Flex gap={"small"} align="center">
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                </Flex>
              </Radio.Group>
              <Tooltip title="Clear value">
                <Button
                  type="dashed"
                  icon={<MinusCircleOutlined />}
                  size="small"
                  shape="circle"
                  onClick={() => handleInputChange(undefined, property)}
                />
              </Tooltip>
            </Flex>
            <span className="label-text">{property}</span>
          </label>
        </Flex>
      );
    }

    if (type === "string" || typeof value === "string") {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <AutoComplete
              id={property}
              options={valuesArray}
              defaultValue={value}
              onBlur={(e) => handleValueChange((e.target as HTMLInputElement).value, property)}
              style={{ width: 200 }}
              onChange={(val) => handleInputChange(val, property)}
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

    if (type === "number" || typeof value === "number") {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <InputNumber
              value={value}
              onBlur={(e) => handleValueChange(e.target.value, property)}
              onChange={(val) => handleInputChange(val, property)}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleInputChange(undefined, property)}
              />
            </Tooltip>
          </Flex>
          <span className="label-text">{property}</span>
        </label>
      );
    }

    if (value === null || value === undefined) {
      return (
        <label className="labelsmall">
          <Input onBlur={(e) => handleValueChange(e.target.value, property)} />
          <span className="label-text">{property}</span>
        </label>
      );
    }
  } else {
    if (value !== null && Array.isArray(value)) {
      const customName = (parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1)).slice(0, -1);
      return (
        <div>
          {(rawData?.[parsedPropertyName] || []).map(
            (item: { [s: string]: unknown } | ArrayLike<unknown>, index: number) => (
              <div key={index}>
                <h4>
                  {customName} {index + 1}
                </h4>
                {Object.entries(item).map(([key, val]) => (
                  <div key={key}>
                    <label className="labelsmall">
                      {key}

                      {InputStyler(val, key, false, scenarios, rawData, setRawData)}
                    </label>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      );
    }
    if (type === "boolean" || typeof value === "boolean") {
      return (
        <Radio.Group onChange={() => null} value={value}>
          <Radio value={true}>Yes</Radio>
          <Radio value={false}>No</Radio>
        </Radio.Group>
      );
    }

    if (type === "string" || typeof value === "string") {
      return <Tag color="blue">{value}</Tag>;
    }

    if (type === "number" || typeof value === "number") {
      if (typeof value === "number" && property.toLowerCase().includes("amount")) {
        if (property.toLowerCase().includes("amount")) {
          const formattedValue = value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          return <Tag color="green">${formattedValue}</Tag>;
        }
      } else {
        return <Tag color="blue">{value}</Tag>;
      }
    }

    if (value === null || value === undefined) {
      return null;
    }
  }

  return <b>{value}</b>;
}
