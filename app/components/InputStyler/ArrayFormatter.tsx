import dayjs from "dayjs";
import { Input, Radio, AutoComplete, InputNumber, Button, Flex, Tooltip, DatePicker } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Scenario } from "@/app/types/scenario";
import { getAutoCompleteOptions, rawDataProps } from "./InputStyler";

interface TemplateObject {
  [key: string]: any;
}

interface ParsedSchema {
  arrayName: string;
  objectTemplate: TemplateObject;
}

interface ArrayComponentProps {
  editable: boolean;
  parsedValue: TemplateObject[] | null;
  parsedPropertyName: string;
  rawData: rawDataProps | null | undefined;
}

export const parseSchemaTemplate = (template: string): ParsedSchema | null => {
  if (!template) return null;
  const match = template.match(/(\w+)\[\{(.*)\}\]/);
  if (!match) {
    return null;
  }

  const arrayName = match[1];
  const properties = match[2].split(",").map((prop) => prop.trim());

  const objectTemplate: TemplateObject = {};
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

export const generateArrayFromSchema = (template: string, initialSize: number = 1): TemplateObject[] | null => {
  if (!template || typeof template !== "string") return null;
  const { objectTemplate } = parseSchemaTemplate(template) ?? {};
  if (!objectTemplate) return null;

  const array: TemplateObject[] = [];
  for (let i = 0; i < initialSize; i++) {
    array.push({ ...objectTemplate });
  }

  return array;
};

export default function ArrayFormatter(
  value: any,
  property: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: rawDataProps | null | undefined,
  setRawData: any
) {
  const valuesArray = getAutoCompleteOptions(property, scenarios);
  let type = typeof value;
  if (valuesArray.length > 0) {
    type = typeof valuesArray[0].value;
  }

  const handleArrayInputItemChange = (arrayName: string, index: number, key: string, newValue: any) => {
    const queryValue = newValue;

    const updatedData: rawDataProps = { ...rawData };
    if (updatedData) {
      if (!updatedData[arrayName]) {
        updatedData[arrayName] = [];
      }
      if (!updatedData[arrayName][index]) {
        updatedData[arrayName][index] = {};
      }
      updatedData[arrayName][index][key] = queryValue;
      setRawData(updatedData);
    }
  };

  const handleArrayItemChange = (arrayName: string, index: number, key: string, newValue: any) => {
    let queryValue: any = newValue;
    if (typeof newValue === "string") {
      if (newValue.trim() === "") {
        queryValue = "";
      } else if (newValue.toLowerCase() === "true") {
        queryValue = true;
      } else if (newValue.toLowerCase() === "false") {
        queryValue = false;
      } else if (!isNaN(Number(newValue))) {
        queryValue = Number(newValue);
      }
    }

    const updatedData: rawDataProps = { ...rawData };
    if (updatedData) {
      if (!updatedData[arrayName]) {
        updatedData[arrayName] = [];
      }
      if (!updatedData[arrayName][index]) {
        updatedData[arrayName][index] = {};
      }
      updatedData[arrayName][index][key] = queryValue;
      setRawData(updatedData);
    }
  };

  const handleClear = (property: any, index: number, key: string, newValue: any) => {
    const inputID = `${property}-${index}-${key}`;
    const inputElement = document.getElementById(inputID) as any;

    if (inputElement) {
      inputElement.value = newValue;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    handleArrayItemChange(property, index, key, newValue);
  };

  const parsedValue = generateArrayFromSchema(property);
  const parsedSchema = parseSchemaTemplate(property);
  const parsedPropertyName = parsedSchema?.arrayName || property;

  // Utility function to get value from a nested object using a path
  const getValueFromPath = (property: string, path: { [key: string]: any }) => {
    if (path.hasOwnProperty(property)) {
      return path[property];
    } else {
      return null;
    }
  };

  // Utility function to set value at a path in a nested object
  const setValueAtPath = (obj: any, path: (string | number)[], value: any): any => {
    if (path.length === 0) return value;
    const [first, ...rest] = path;
    const newObj = typeof first === "number" ? [] : {};
    return {
      ...obj,
      [first]: rest.length ? setValueAtPath(obj[first] || newObj, rest, value) : value,
    };
  };

  // Utility function to add a copy of an object in an array
  const addCopyInArray = (arrayPath: string, parsedValue: any) => {
    const currentArray = rawData ? getValueFromPath(arrayPath, rawData) || [] : [];
    const newItem = generateArrayFromSchema(property)?.[0] ?? parsedValue; // Adjusting for potential null or undefined
    if (newItem !== null && newItem !== undefined) {
      currentArray.push(newItem);
    }
    const newData = { ...rawData, [arrayPath]: currentArray };
    setRawData(newData);
  };

  // Utility function to remove an item from an array
  const removeItemFromArray = (arrayPath: string) => {
    const currentArray = rawData ? getValueFromPath(arrayPath, rawData) || [] : [];
    currentArray.pop();
    const newData = { ...rawData, [arrayPath]: currentArray };
    setRawData(newData);
  };

  const ArrayComponent = ({ editable, parsedValue, parsedPropertyName, rawData }: ArrayComponentProps) => {
    if (!editable) return null;
    if (!Array.isArray(parsedValue)) return null;

    const dateCheck = /date|month|year|day/i;
    const customName = (parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1)).slice(0, -1);

    const renderItem = (item: { [s: string]: unknown } | ArrayLike<unknown>, index: any) => {
      return (
        <div key={index}>
          <Flex gap={"small"} align="center">
            <h4>
              {customName} {index ? `${Number(index) + 1}` : "1"}
            </h4>
          </Flex>
          <Flex gap={"small"} align="left" vertical>
            {Object.entries(item).map(([key, val]) => (
              <div key={key}>
                <label className="labelsmall">
                  <Flex gap={"small"} align="center">
                    {key}:{renderInput(val, key, index)}
                  </Flex>
                </label>
              </div>
            ))}
          </Flex>
        </div>
      );
    };

    const renderInput = (val: unknown, key: string, index: number) => {
      if (typeof val === "boolean") {
        return (
          <Flex gap={"small"} align="center" vertical>
            <Flex gap={"small"} align="center">
              <Radio.Group
                onChange={(e) => handleArrayInputItemChange(parsedPropertyName, index, key, e.target.value)}
                value={val}
              >
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Flex>
          </Flex>
        );
      }
      if (typeof val === "number") {
        return (
          <Flex gap={"small"} align="center">
            <InputNumber
              value={val}
              onBlur={(e) => handleArrayItemChange(parsedPropertyName, index, key, e.target.value)}
              onChange={(newVal) => handleArrayInputItemChange(parsedPropertyName, index, key, newVal)}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleArrayInputItemChange(parsedPropertyName, index, key, 0)}
              />
            </Tooltip>
          </Flex>
        );
      }
      if (typeof val === "string" && dateCheck.test(key)) {
        return (
          <Flex gap={"small"} align="center">
            <DatePicker
              allowClear={false}
              id={`${parsedPropertyName}-${index}-${key}`}
              defaultValue={val ? dayjs(val, "YYYY-MM-DD") : null}
              format="YYYY-MM-DD"
              onChange={(val) =>
                handleArrayInputItemChange(parsedPropertyName, index, key, val?.toISOString().split("T")[0] || null)
              }
              style={{ width: 200 }}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleClear(parsedPropertyName, index, key, "")}
              />
            </Tooltip>
          </Flex>
        );
      }
      if (typeof val === "string") {
        return (
          <Flex gap={"small"} align="center">
            <AutoComplete
              id={`${parsedPropertyName}-${index}-${key}`}
              options={getAutoCompleteOptions(key)}
              value={val}
              onBlur={(e) =>
                handleArrayItemChange(parsedPropertyName, index, key, (e.target as HTMLInputElement).value)
              }
              style={{ width: 200 }}
              onChange={(newVal) => handleArrayInputItemChange(parsedPropertyName, index, key, newVal)}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleClear(parsedPropertyName, index, key, "")}
              />
            </Tooltip>
          </Flex>
        );
      }
      return <Input onBlur={(e) => handleArrayItemChange(parsedPropertyName, index, key, e.target.value)} />;
    };

    return (
      <div>
        <Button icon={<PlusCircleOutlined />} onClick={() => addCopyInArray(parsedPropertyName, parsedValue[0])}>
          Add {customName}
        </Button>
        <Button icon={<MinusCircleOutlined />} onClick={() => removeItemFromArray(parsedPropertyName)}>
          Remove {customName}
        </Button>
        {(rawData?.[parsedPropertyName] || []).map(renderItem)}
      </div>
    );
  };

  return <ArrayComponent {...{ editable, parsedValue, parsedPropertyName, rawData }} />;
}
