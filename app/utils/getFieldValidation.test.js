import { getFieldValidation } from "./utils";
import dayjs from "dayjs";

describe("getFieldValidation", () => {
  test("handles true-false dataType", () => {
    const result = getFieldValidation("", "", "true-false");
    expect(result).toEqual({ type: "true-false" });
  });

  test("handles equality validation", () => {
    const result = getFieldValidation("5", "==", "number-input");
    expect(result).toEqual({ equals: "5", type: "number" });
  });

  test("handles inequality validation", () => {
    const result = getFieldValidation("hello", "!=", "text");
    expect(result).toEqual({ doesnotmatch: "hello", type: "text" });
  });

  test("handles regex validation", () => {
    const result = getFieldValidation("^[a-z]+$", "regex", "text");
    expect(result).toEqual({ pattern: /^[a-z]+$/, type: "text" });
  });

  test("handles greater than or equal to for numbers", () => {
    const result = getFieldValidation("10", ">=", "number-input");
    expect(result).toEqual({ min: 10, type: "number" });
  });

  test("handles greater than or equal to for dates", () => {
    const date = "2023-01-01";
    const result = getFieldValidation(date, ">=", "date");
    expect(result).toEqual({ min: dayjs(date), type: "date" });
  });

  test("handles greater than for numbers", () => {
    const result = getFieldValidation("10", ">", "number-input");
    expect(result).toEqual({ min: 11, type: "number" });
  });

  test("handles less than or equal to for numbers", () => {
    const result = getFieldValidation("10", "<=", "number-input");
    expect(result).toEqual({ max: 10, type: "number" });
  });

  test("handles less than for numbers", () => {
    const result = getFieldValidation("10", "<", "number-input");
    expect(result).toEqual({ max: 9, type: "number" });
  });

  test("handles inclusive number range", () => {
    const result = getFieldValidation("[1, 10]", "[num]", "number-input");
    expect(result).toEqual({
      range: { min: 1, max: 10, inclusive: true },
      type: "number",
    });
  });

  test("handles exclusive date range", () => {
    const result = getFieldValidation("(2023-01-01, 2023-12-31)", "(date)", "date");
    expect(result).toEqual({
      range: { min: dayjs("2023-01-01"), max: dayjs("2023-12-31"), inclusive: false },
      type: "date",
    });
  });

  test("handles text options", () => {
    const result = getFieldValidation("red,green,blue", "[=text]", "text");
    expect(result).toEqual({
      options: [
        { value: "red", type: "string" },
        { value: "green", type: "string" },
        { value: "blue", type: "string" },
        { value: null, type: null, label: "No Value" },
      ],
      type: "select",
    });
  });

  test("handles number options", () => {
    const result = getFieldValidation("1,2,3", "[=num]", "number-input");
    expect(result).toEqual({
      options: [
        { value: "1", type: "string" },
        { value: "2", type: "string" },
        { value: "3", type: "string" },
        { value: null, type: null, label: "No Value" },
      ],
      type: "select",
    });
  });

  test("handles unknown validation type", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = getFieldValidation("", "unknown", "text");
    expect(result).toEqual({ type: "text" });
    expect(consoleSpy).toHaveBeenCalledWith("Unknown validation type: unknown");
    consoleSpy.mockRestore();
  });
});
