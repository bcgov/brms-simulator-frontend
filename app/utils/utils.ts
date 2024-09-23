import dayjs from "dayjs";
/**
 * Downloads a file from a given data blob.
 *
 * @param dataBlob - The data blob to download.
 * @param type - The type of the data blob.
 * @param filename - The name of the file to be downloaded.
 */
export const downloadFileBlob = (dataBlob: any, type: string, filename: string) => {
  const blob = new Blob([dataBlob], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Gets the last section of a filepath (aka the filename). Shortens if desired.
 * @param filepath
 * @param maxLength
 * @param showTrailingDots
 */
export const getShortFilenameOnly = (
  filepath: string,
  maxLength: number | null = 25,
  showTrailingDots = true
): string => {
  const filepathSections = filepath.split("/");
  const filename = filepathSections[filepathSections.length - 1];
  if (maxLength && filename.length > maxLength) {
    return `${filename.substring(0, maxLength - 3)}${showTrailingDots ? "..." : ""}`;
  }
  return filename;
};

/**
 * Converts a number to a dollar format
 * @param value
 */

export const dollarFormat = (value: number) => {
  const newValue = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return newValue;
};

/**
 * Get Field validation formatting
 * @param validationCriteria
 * @param validationType
 * @param dataType
 * @returns Record<string, any>
 */

// Sample reusable function to get field validation parameters
export const getFieldValidation = (validationCriteria: string, validationType: string, dataType: string) => {
  const validationRules: Record<string, any> = {};
  if (dataType === "true-false") {
    validationRules["type"] = "true-false";
    return validationRules;
  }

  switch (validationType) {
    case "==": // Data equal to
      validationRules["equals"] = validationCriteria;
      break;

    case "!=": // Data not equal to
      validationRules["doesnotmatch"] = validationCriteria;
      break;

    case "regex": // Text Pattern (regex)
      validationRules["pattern"] = new RegExp(validationCriteria);
      break;

    case ">=": // Number greater than or equal to
      validationRules["min"] = dataType === "number-input" ? Number(validationCriteria) : dayjs(validationCriteria);
      break;

    case ">": // Number greater than
      validationRules["min"] = dataType === "number-input" ? Number(validationCriteria) + 1 : dayjs(validationCriteria);
      break;

    case "<=": // Number less than or equal to
      validationRules["max"] = dataType === "number-input" ? Number(validationCriteria) : dayjs(validationCriteria);
      break;

    case "<": // Number less than
      validationRules["max"] = dataType === "number-input" ? Number(validationCriteria) - 1 : dayjs(validationCriteria);
      break;

    case "(num)": // Number within range (exclusive)
    case "[num]": // Number within range (inclusive)
    case "(date)": // Date within range (exclusive)
    case "[date]": // Date within range (inclusive)
      const range = validationCriteria.replace(/[\[\]\(\)]/g, "").split(",");
      if (range.length === 2) {
        validationRules["range"] = {
          min: dataType === "number-input" ? Number(range[0].trim()) : dayjs(range[0].trim()),
          max: dataType === "number-input" ? Number(range[1].trim()) : dayjs(range[1].trim()),
          inclusive: validationType.startsWith("["), // true for inclusive ranges
        };
      }
      break;

    case "[=text]": // Text Options
    case "[=num]": // Number Options
    case "[=date]": // Date Options
      const options: { value: string | number | Date | null; type: string | null | undefined; label?: string }[] =
        validationCriteria
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((value) => ({ value: value.trim(), type: typeof value }));
      options.push({ value: null, type: null, label: "No Value" }); // Add null as the last option
      validationRules["options"] = options;
      break;

    default:
      console.warn(`Unknown validation type: ${validationType}`);
  }

  // Enforce proper type-based validation
  if (validationRules["options"] && validationRules?.["options"].length > 0) {
    validationRules["type"] = "select";
  } else if (dataType === "number-input") {
    validationRules["type"] = "number";
  } else if (dataType === "date") {
    validationRules["type"] = "date";
  } else {
    validationRules["type"] = "text";
  }

  return validationRules;
};
