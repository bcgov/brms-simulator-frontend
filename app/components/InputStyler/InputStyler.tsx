import { Tag, Input, Radio, AutoComplete, InputNumber, Flex, Button } from "antd";
import { Scenario } from "@/app/types/scenario";
interface TemplateObject {
  [key: string]: any;
}

interface ParsedSchema {
  arrayName: string;
  objectTemplate: TemplateObject;
}

export const parseSchemaTemplate = (template: string): ParsedSchema => {
  if (!template) return null;
  const match = template.match(/(\w+)\[\{(.*)\}\]/);
  if (!match) {
    return template;
  }

  const arrayName = match[1];
  const properties = match[2].split(",").map((prop) => prop.trim());

  const objectTemplate: TemplateObject = {};
  properties.forEach((prop) => {
    objectTemplate[prop] = ""; // Initialize with empty string or any default value
  });

  return { arrayName, objectTemplate };
};

const generateArrayFromSchema = (template: string, initialSize: number = 1): TemplateObject[] => {
  if (!template || typeof template !== "string") return null;
  const { objectTemplate } = parseSchemaTemplate(template) ?? {};
  if (!objectTemplate) return null;

  const array: TemplateObject[] = [];
  for (let i = 0; i < initialSize; i++) {
    array.push({ ...objectTemplate });
  }

  return array;
};

export default function InputStyler(
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

  const handleArrayItemChange = (arrayName: string, index: number, key: string, newValue: any) => {
    const updatedData = { ...rawData };
    if (!updatedData[arrayName]) {
      updatedData[arrayName] = [];
    }
    if (!updatedData[arrayName][index]) {
      updatedData[arrayName][index] = {};
    }
    updatedData[arrayName][index][key] = newValue;
    setRawData(updatedData);
  };

  const parsedValue = generateArrayFromSchema(property);
  const parsedSchema = parseSchemaTemplate(property);
  const parsedPropertyName = parsedSchema?.arrayName || property;

  // Utility function to get value from a nested object using a path
  const getValueFromPath = (property, path) => {
    if (path.hasOwnProperty(property)) {
      return path[property];
    } else {
      return null;
    }
  };

  // Utility function to set value at a path in a nested object
  const setValueAtPath = (obj, path, value) => {
    if (path.length === 0) return value;
    const [first, ...rest] = path;
    return {
      ...obj,
      [first]: rest.length ? setValueAtPath(obj[first] || {}, rest, value) : value,
    };
  };

  // Reusable function to add a copy of an object in an array
  const addCopyInArray = (arrayPath: string, parsedValue: any) => {
    const currentArray = getValueFromPath(arrayPath, rawData) || [];
    currentArray.push(generateArrayFromSchema(property)[0]);
    const newData = { ...rawData, [arrayPath]: currentArray };
    setRawData(newData);
    console.log(newData, "this is the parsed value");
  };

  if (editable) {
    if (Array.isArray(parsedValue)) {
      const customName = (parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1)).slice(0, -1);
      return (
        <div>
          <Button onClick={() => addCopyInArray(parsedPropertyName, parsedValue[0])}>Add {customName}</Button>
          {(rawData[parsedPropertyName] || []).map((item, index) => (
            <div key={index}>
              <h4>
                {customName} {index + 1}
              </h4>
              {Object.entries(item).map(([key, val]) => (
                <div key={key}>
                  <label className="labelsmall">
                    {key}:
                    <Input
                      value={val as string}
                      onChange={(e) => handleArrayItemChange(parsedPropertyName, index, key, e.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "object" && value !== null && !Array.isArray(property) && property !== null) {
      return <div>{Object.keys(value).length}</div>;
    }
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
