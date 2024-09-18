import { AutoComplete, InputNumber, Flex, Button, Tooltip } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { Scenario } from "@/app/types/scenario";
import { getFieldValidation } from "@/app/utils/utils";
import {
  DefaultInput,
  ObjectArrayInput,
  ObjectLengthDisplay,
  BooleanInput,
  SelectInput,
  DateInput,
  ReadOnlyArrayDisplay,
  ReadOnlyBooleanDisplay,
  ReadOnlyStringDisplay,
  ReadOnlyNumberDisplay,
} from "./subcomponents/InputComponents";

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

export const parsePropertyName = (property: string): string => {
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

  if (editable) {
    const validationRules = getFieldValidation(
      ruleProperties?.validationCriteria,
      ruleProperties?.validationType,
      ruleProperties?.type ?? ruleProperties?.dataType
    );
    if (ruleProperties?.type === "object-array" && ruleProperties?.child_fields?.length > 0) {
      return (
        <ObjectArrayInput
          show={true}
          value={value || []}
          property={property}
          ruleProperties={ruleProperties}
          handleInputChange={handleInputChange}
          scenarios={scenarios}
          rawData={rawData}
        />
      );
    }
    if (typeof value === "object" && value !== null && !Array.isArray(property) && property !== null) {
      return <ObjectLengthDisplay show={true} value={value} />;
    }

    if (validationRules?.type === "true-false") {
      return <BooleanInput show={true} value={value} property={property} handleInputChange={handleInputChange} />;
    }
    if (validationRules?.options) {
      return (
        <SelectInput
          show={true}
          value={value}
          property={property}
          options={validationRules?.options}
          handleInputChange={handleInputChange}
        />
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
        <DateInput
          show={true}
          value={value}
          property={property}
          maximum={maximum}
          minimum={minimum}
          handleInputChange={handleInputChange}
          handleClear={handleClear}
        />
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
      return <DefaultInput show={true} property={property} handleValueChange={handleValueChange} />;
    }
  } else {
    if (Array.isArray(value)) {
      return (
        <ReadOnlyArrayDisplay
          show={true}
          value={value}
          property={property}
          scenarios={scenarios}
          rawData={rawData}
          setRawData={setRawData}
          ruleProperties={ruleProperties}
        />
      );
    }
    if (type === "boolean" || typeof value === "boolean") {
      return <ReadOnlyBooleanDisplay show={true} value={value} />;
    }

    if (type === "string" || typeof value === "string") {
      return <ReadOnlyStringDisplay show={true} value={value} />;
    }

    if (type === "number" || typeof value === "number") {
      return <ReadOnlyNumberDisplay show={true} value={value} property={property} />;
    }

    if (value === null || value === undefined) {
      return null;
    }
  }

  return <b>{value}</b>;
}
