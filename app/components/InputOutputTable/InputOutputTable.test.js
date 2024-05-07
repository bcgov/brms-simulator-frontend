// NOTE: this is just a placeholder test file, it should be updated with actual tests
import * as React from "react";
import { render } from "@testing-library/react";
import InputOutputTable from "./InputOutputTable";

describe("InputOutputTable", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  test("renders InputOutputTable component", async () => {
    render(<InputOutputTable />);
    // Added bad test on purpose to show how it failsßß
    expect(true).toBe(false);
  });
});
