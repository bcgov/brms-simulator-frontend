import { Scenario } from "./scenario";

export interface InputProps {
  show: boolean;
  property: string;
  handleInputChange?: (value: any, property: string) => void;
  handleValueChange?: (value: string, property: string) => void;
}

export interface ChildFieldInputProps {
  property: string;
  item: any;
  each: any;
  index: number;
  scenarios: any;
  rawData: any;
  value: any;
  handleInputChange: (value: any, property: string) => void;
}

export interface ObjectArrayInputProps extends InputProps {
  value: any[];
  ruleProperties: any;
  scenarios: Scenario[];
  rawData: any;
  handleInputChange: (value: any, property: string) => void;
  setRawData?: (data: any) => void;
}

export interface ObjectLengthDisplayProps {
  show: boolean;
  value: any;
}

export interface BooleanInputProps extends InputProps {
  value: boolean;
  handleInputChange: (value: any, property: string) => void;
}

export interface SelectInputProps extends InputProps {
  value: any;
  options: any[];
  handleInputChange: (value: any, property: string) => void;
}

export interface DateInputProps extends InputProps {
  value: any;
  maximum: datejs.Date | null | undefined;
  minimum: datejs.Date | null | undefined;
  handleInputChange: (value: any, property: string) => void;
  handleClear: (property: string) => void;
}

export interface TextInputProps extends InputProps {
  value: any;
  valuesArray: any[];
  handleValueChange: (value: string, property: string) => void;
  handleInputChange: (value: any, property: string) => void;
  handleClear: (property: string) => void;
}

export interface NumberInputProps extends InputProps {
  value: any;
  maximum: number | null | undefined;
  minimum: number | null | undefined;
  handleValueChange: (value: string, property: string) => void;
  handleInputChange: (value: any, property: string) => void;
}

export interface ReadOnlyProps {
  show: boolean;
  value: any;
}

export interface ReadOnlyNumberDisplayProps extends ReadOnlyProps {
  property: string;
}

export interface ReadOnlyArrayDisplayProps extends ObjectArrayInputProps {
  handleInputChange?: (value: any, property: string) => void;
}
