import dayjs from "dayjs";
import { Tag, Input, Radio, AutoComplete, InputNumber, Flex, Button, Tooltip, DatePicker, Select } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Scenario } from "@/app/types/scenario";
import { dollarFormat, getFieldValidation } from "@/app/utils/utils";

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

const parsePropertyName = (property: string): string => {
  const match = property.match(/\[.*?\]\.(.+)$/);
  return match ? match[1] : property;
};

export const parseSchemaTemplate = (template: string) => {
  if (!template) return null;
  const match = template.match(/(\w+)\[\{(.*)\}\]/);
  if (!match) {
    return null;
  }

  const arrayName = match[1];
  const properties = match[2].split(",").map((prop) => prop.trim());

  const objectTemplate: { [key: string]: any } = {};
  properties.forEach((prop) => {
    const [propertyName, propertyType] = prop.split(":");
    switch (propertyType.toLowerCase()) {
      case "string":
        objectTemplate[propertyName] = "";
        break;
      case "boolean":
        objectTemplate[propertyName] = false;
        break;
      case "number":
        objectTemplate[propertyName] = 0;
        break;
      default:
        objectTemplate[propertyName] = undefined;
        break;
    }
  });

  return { arrayName, objectTemplate };
};

export default function InputStyler(
  value: any,
  property: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: rawDataProps | null | undefined,
  setRawData: any,
  ruleProperties: any
) {
  const handleValueChange = (value: any, property: string) => {
    let queryValue: any = value;
    if (typeof value === "string") {
      if (value === "") queryValue = "";
      else if (value.toLowerCase() === "true") {
        queryValue = true;
      } else if (value.toLowerCase() === "false") {
        queryValue = false;
      } else if (!isNaN(Number(value))) {
        queryValue = Number(value);
      }
    }

    const updatedData = { ...rawData, [property]: queryValue };

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
    console.log("this is testing handleInputChange", val, property);
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

  const parsedSchema = parseSchemaTemplate(property);
  const parsedPropertyName = parsedSchema?.arrayName || property;

  if (editable) {
    if (ruleProperties?.type === "object-array" && ruleProperties?.child_fields?.length > 0) {
      const customName = parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1);
      value = value || [];
      const childFields = ruleProperties?.child_fields || [];
      const childFieldMap = childFields.reduce((acc: { [x: string]: null }, field: { name: string | number }) => {
        acc[field.name] = null;
        return acc;
      }, {});
      return (
        <div>
          <Button icon={<PlusCircleOutlined />} onClick={() => handleInputChange([...value, childFieldMap], property)}>
            Add
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={() => handleInputChange(value.slice(0, -1), property)}>
            Remove
          </Button>
          {value.map((item: any, index: number) => (
            <div key={index}>
              <h4>
                {customName} {index + 1}
              </h4>
              <label className="labelsmall">
                {childFields.map((each: any) => (
                  <div key={each.property}>
                    {each.label}
                    {InputStyler(
                      item[each.name],
                      `${property}[${index}].${each.name}`,
                      editable,
                      scenarios,
                      rawData,
                      (newData: any) => {
                        const updatedArray = [...value];
                        updatedArray[index] = {
                          ...updatedArray[index],
                          [each.name]: newData[`${property}[${index}].${each.name}`],
                        };
                        handleInputChange(updatedArray, property);
                      },
                      each
                    )}
                  </div>
                ))}
              </label>
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object" && value !== null && !Array.isArray(property) && property !== null) {
      return <div>{Object.keys(value).length}</div>;
    }
    const validationRules = getFieldValidation(
      ruleProperties?.validationCriteria,
      ruleProperties?.validationType,
      ruleProperties?.type ?? ruleProperties?.dataType
    );

    if (validationRules?.type === "true-false") {
      return (
        <Flex gap={"small"} align="center" vertical>
          <label className="labelsmall">
            <Flex gap={"small"} align="center">
              <Radio.Group
                onChange={(e) => handleInputChange(e.target.value, property)}
                value={value === true ? true : value === false ? false : undefined}
              >
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
            <span className="label-text">{parsePropertyName(property)}</span>
          </label>
        </Flex>
      );
    }
    if (validationRules?.options) {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <Select
              id={property}
              options={validationRules?.options}
              defaultValue={value}
              style={{ width: 200 }}
              onChange={(val) => handleInputChange(val, property)}
            />
          </Flex>
          <span className="label-text">{parsePropertyName(property)}</span>
        </label>
      );
    }

    if (validationRules?.type === "text") {
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
          <span className="label-text">{parsePropertyName(property)}</span>
        </label>
      );
    }
    const maximum = validationRules?.range ? validationRules?.range.max : validationRules?.max;
    const minimum = validationRules?.range ? validationRules?.range.min : validationRules?.min;
    if (validationRules?.type === "date") {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <DatePicker
              allowClear={false}
              id={property}
              maxDate={maximum}
              minDate={minimum}
              defaultValue={value ? dayjs(value, "YYYY-MM-DD") : null}
              format="YYYY-MM-DD"
              onChange={(val) => {
                const formattedDate = val ? val.format("YYYY-MM-DD") : null;
                handleInputChange(formattedDate, property);
              }}
              style={{ width: 200 }}
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
          <span className="label-text">{parsePropertyName(property)}</span>
        </label>
      );
    }

    if (validationRules?.type === "number") {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <InputNumber
              max={maximum}
              min={minimum}
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
          <span className="label-text">{parsePropertyName(property)}</span>
        </label>
      );
    }

    if (value === null || value === undefined) {
      return (
        <label className="labelsmall">
          <Input onBlur={(e) => handleValueChange(e.target.value, property)} />
          <span className="label-text">{parsePropertyName(property)}</span>
        </label>
      );
    }
  } else {
    if (Array.isArray(value)) {
      const customName = parsePropertyName(property);
      return (
        <div>
          {value.map((item: any, index: number) => (
            <div key={index}>
              <h4>
                {customName} {index + 1}
              </h4>
              {Object.entries(item).map(([key, val]) => (
                <div key={key}>
                  <label className="labelsmall">
                    {key}
                    {InputStyler(val, key, false, scenarios, rawData, setRawData, ruleProperties)}
                  </label>
                </div>
              ))}
            </div>
          ))}
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
          const formattedValue = dollarFormat(value);
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
