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
  NumberInput,
  TextInput,
} from "./subcomponents/InputComponents";

export interface rawDataProps {
  [key: string]: any;
  rulemap?: boolean;
}

export const getAutoCompleteOptions = (field: string, scenarios: Scenario[] = []) => {
  if (!scenarios) return [];
  const optionsSet = new Set<string>();

  scenarios.forEach((scenario) => {
    scenario.variables
      .filter((variable) => variable.name === field)
      .forEach((variable) => optionsSet.add(variable.value));
  });

  return Array.from(optionsSet).map((value) => ({ value, type: typeof value }));
};

export const parsePropertyName = (field: string): string => {
  const match = field.match(/\[.*?\]\.(.+)$/);
  return match ? match[1] : field;
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
  field: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: rawDataProps | null | undefined,
  setRawData: any,
  ruleProperties: any
) {
  const updateFieldValue = (field: string, value: any) => {
    const updatedData = { ...rawData, [field]: value };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      console.error("setRawData is not a function or is undefined");
    }
  };

  const handleValueChange = (value: any, field: string) => {
    let queryValue: any = value;
    if (typeof value === "string") {
      if (value === "") queryValue = "";
      else if (value.toLowerCase() === "true") queryValue = true;
      else if (value.toLowerCase() === "false") queryValue = false;
      else if (!isNaN(Number(value))) queryValue = Number(value);
    }

    updateFieldValue(field, queryValue);
  };

  const handleClear = (field: any) => {
    const inputElement = document.getElementById(field) as any;

    if (inputElement) {
      inputElement.value = null;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    handleValueChange(null, field);
  };

  const handleInputChange = (value: any, field: string) => {
    updateFieldValue(field, value);
  };

  const valuesArray = getAutoCompleteOptions(field, scenarios);
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
    if (ruleProperties?.type === "object-array" && ruleProperties?.childFields?.length > 0) {
      return (
        <ObjectArrayInput
          show={true}
          value={value || []}
          field={field}
          ruleProperties={ruleProperties}
          handleInputChange={handleInputChange}
          scenarios={scenarios}
          rawData={rawData}
        />
      );
    }
    switch (validationRules?.type) {
      case "true-false":
        return (
          <BooleanInput
            show={validationRules?.type === "true-false"}
            value={value}
            field={field}
            handleInputChange={handleInputChange}
          />
        );
      case "select":
        return (
          <SelectInput
            show={validationRules?.type === "select"}
            value={value}
            field={field}
            options={validationRules?.options}
            handleInputChange={handleInputChange}
          />
        );
      case "text":
        return (
          <TextInput
            show={validationRules?.type === "text"}
            value={value}
            field={field}
            valuesArray={valuesArray}
            handleValueChange={handleValueChange}
            handleInputChange={handleInputChange}
            handleClear={handleClear}
          />
        );
      case "number":
        return (
          <NumberInput
            show={validationRules?.type === "number"}
            value={value}
            field={field}
            maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
            minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
            handleValueChange={handleValueChange}
            handleInputChange={handleInputChange}
          />
        );
      case "date":
        return (
          <DateInput
            show={validationRules?.type === "date"}
            value={value}
            field={field}
            maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
            minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
            handleInputChange={handleInputChange}
            handleClear={handleClear}
          />
        );
      default:
        return (
          <DefaultInput
            show={value === null || value === undefined}
            field={field}
            handleValueChange={handleValueChange}
          />
        );
    }
  } else {
    return (
      <>
        <ReadOnlyArrayDisplay
          show={Array.isArray(value)}
          value={value}
          field={field}
          scenarios={scenarios}
          rawData={rawData}
          setRawData={setRawData}
          ruleProperties={ruleProperties}
        />
        <ReadOnlyBooleanDisplay show={type === "boolean" || typeof value === "boolean"} value={value} />
        <ReadOnlyStringDisplay show={type === "string" || typeof value === "string"} value={value} />
        <ReadOnlyNumberDisplay show={type === "number" || typeof value === "number"} value={value} field={field} />
      </>
    );
  }
}
