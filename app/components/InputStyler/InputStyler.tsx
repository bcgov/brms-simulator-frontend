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
    return (
      <>
        {" "}
        {validationRules?.type ? (
          <>
            <ObjectLengthDisplay
              show={typeof value === "object" && value !== null && !Array.isArray(property) && property !== null}
              value={value || []}
            />
            <BooleanInput
              show={validationRules?.type === "true-false"}
              value={value}
              property={property}
              handleInputChange={handleInputChange}
            />
            <SelectInput
              show={validationRules?.type === "select"}
              value={value}
              property={property}
              options={validationRules?.options}
              handleInputChange={handleInputChange}
            />
            <TextInput
              show={validationRules?.type === "text"}
              value={value}
              property={property}
              valuesArray={valuesArray}
              handleValueChange={handleValueChange}
              handleInputChange={handleInputChange}
              handleClear={handleClear}
            />
            <NumberInput
              show={validationRules?.type === "number"}
              value={value}
              property={property}
              maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
              minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
              handleValueChange={handleValueChange}
              handleInputChange={handleInputChange}
            />
            <DateInput
              show={validationRules?.type === "date"}
              value={value}
              property={property}
              maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
              minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
              handleInputChange={handleInputChange}
              handleClear={handleClear}
            />
          </>
        ) : (
          <DefaultInput
            show={value === null || value === undefined}
            property={property}
            handleValueChange={handleValueChange}
          />
        )}
      </>
    );
  } else {
    return (
      <>
        <ReadOnlyArrayDisplay
          show={Array.isArray(value)}
          value={value}
          property={property}
          scenarios={scenarios}
          rawData={rawData}
          setRawData={setRawData}
          ruleProperties={ruleProperties}
        />
        <ReadOnlyBooleanDisplay show={type === "boolean" || typeof value === "boolean"} value={value} />
        <ReadOnlyStringDisplay show={type === "string" || typeof value === "string"} value={value} />
        <ReadOnlyNumberDisplay
          show={type === "number" || typeof value === "number"}
          value={value}
          property={property}
        />
      </>
    );
  }
}
