import { Tag, Input, Radio, AutoComplete, InputNumber, Flex } from "antd";
import { Scenario } from "@/app/types/scenario";

export default function inputStyler(
  value: any,
  property: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: object = {},
  setRawData: any
) {
  const getAutoCompleteOptions = (property: string) => {
    if (!scenarios) return [];
    const optionsSet = new Set<string>();

    scenarios.forEach((scenario) => {
      scenario.variables
        .filter((variable) => variable.name === property)
        .forEach((variable) => optionsSet.add(variable.value));
    });

    return Array.from(optionsSet).map((value) => ({ value, type: typeof value }));
  };

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

  const handleInputChange = (val: any, property: string) => {
    const updatedData = { ...rawData, [property]: val };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    }
  };

  const valuesArray = getAutoCompleteOptions(property);
  let type = typeof value;
  if (valuesArray.length > 0) {
    type = typeof valuesArray[0].value;
  }

  if (editable) {
    if (type === "boolean" || typeof value === "boolean") {
      return (
        <Flex gap={"small"} align="center" vertical>
          <label className="labelsmall">
            <Radio.Group onChange={(e) => handleInputChange(e.target.value, property)} value={value}>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
            <span className="label-text">{property}</span>
          </label>
        </Flex>
      );
    }

    if (type === "string" || typeof value === "string") {
      return (
        <label className="labelsmall">
          <AutoComplete
            options={valuesArray}
            defaultValue={value}
            onBlur={(e) => handleValueChange((e.target as HTMLInputElement).value, property)}
            style={{ width: 200 }}
            onChange={(val) => handleInputChange(val, property)}
          />
          <span className="label-text">{property}</span>
        </label>
      );
    }

    if (type === "number" || typeof value === "number") {
      return (
        <label className="labelsmall">
          <InputNumber
            value={value}
            onBlur={(e) => handleValueChange(e.target.value, property)}
            onChange={(val) => handleInputChange(val, property)}
          />
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
      if (property.toLowerCase().includes("amount")) {
        return <Tag color="green">${value}</Tag>;
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
