import { Scenario, Variable } from "../types/scenario";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { getScenariosByFilename } from "./api";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";
/**
 * Prepares scenarios for JSON insertion
 * @param scenarios Array of scenarios to format
 * @returns Formatted scenario object
 */
export const formatScenariosForJSON = (scenarios: Scenario[]) => {
  return {
    tests: scenarios.map((scenario: Scenario) => ({
      name: scenario.title || "Default name",
      input: scenario.variables.reduce((obj: any, each: Variable) => {
        obj[each.name] = each.value;
        return obj;
      }, {}),
      output: scenario.expectedResults.reduce((obj, each) => {
        obj[each.name] = each.value;
        return obj;
      }, {}),
    })),
  };
};

/**
 * Converts test data from JSON to scenario format
 * @param tests Array of test objects from JSON
 * @returns Array of formatted scenarios
 */
export const convertTestsToScenarios = (tests: any[]): Scenario[] => {
  return tests.map(test => ({
    title: test.name,
    ruleID: test.ruleID || '',
    filepath: test.filepath || '',
    variables: Object.entries(test.input).map(([name, value]) => ({
      name,
      value
    })),
    expectedResults: Object.entries(test.output).map(([name, value]) => ({
      name,
      value
    }))
  }));
};

/**
 * Creates a complete rule JSON with scenarios
 * @param filename The rule filename
 * @param ruleContent Current rule content
 * @returns Promise with the complete rule JSON
 */
export const createRuleJSONWithScenarios = async (filename: string, ruleContent: DecisionGraphType) => {
  try {
    const scenarios = await getScenariosByFilename(filename);
    const scenarioObject = formatScenariosForJSON(scenarios);
    return {
      ...DEFAULT_RULE_CONTENT,
      ...ruleContent,
      ...scenarioObject,
    };
  } catch (error) {
    console.error("Error preparing rule JSON:", error);
    throw error;
  }
};
