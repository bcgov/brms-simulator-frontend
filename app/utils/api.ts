import { DecisionGraphType } from "@gorules/jdm-editor";
import axios from "axios";
import { RuleInfo } from "../types/ruleInfo";
import { RuleMap } from "../types/rulemap";

const axiosAPIInstance = axios.create({
  // For server side calls, need full URL, otherwise can just use /api
  baseURL: typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Retrieves a rule data from the API based on the provided rule ID.
 * @param ruleId The ID of the rule data to retrieve.
 * @returns The rule data.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleDataById = async (ruleId: string): Promise<RuleInfo> => {
  try {
    const { data } = await axiosAPIInstance.get(`/ruleData/${ruleId}`);
    return data;
  } catch (error) {
    console.error(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves all rules data from the API.
 * @returns The rule data list.
 * @throws If an error occurs while fetching the rule data.
 */
export const getAllRuleData = async (): Promise<RuleInfo[]> => {
  try {
    const { data } = await axiosAPIInstance.get("/ruleData/list");
    return data;
  } catch (error) {
    console.error(`Error fetching rule data: ${error}`);
    throw error;
  }
};

/**
 * Gets list of all rule documents
 * @returns The rule documents list.
 * @throws If an error occurs while fetching the rule documents list.
 */
export const getAllRuleDocuments = async (): Promise<string[]> => {
  try {
    const { data } = await axiosAPIInstance.get("/documents/all");
    return data;
  } catch (error) {
    console.error(`Error fetching rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a document from the API based on the provided document ID.
 * @param docId The ID of the document to retrieve.
 * @returns The content of the document.
 * @throws If an error occurs while retrieving the document.
 */
export const getDocument = async (jsonFilePath: string): Promise<DecisionGraphType> => {
  try {
    const { data } = await axiosAPIInstance.get(`/documents?ruleFileName=${encodeURIComponent(jsonFilePath)}`);
    if (!data || !data.nodes || !data.edges) {
      throw new Error("Unexpected format of the returned data");
    }
    return data;
  } catch (error) {
    console.error(`Error getting the gorules document: ${error}`);
    throw error;
  }
};

/**
 * Posts a decision to the API for evaluation.
 * @param jsonFile The JSON file to use for the decision.
 * @param decisionGraph The decision graph to evaluate.
 * @param context The context for the decision evaluation.
 * @returns The result of the decision evaluation.
 * @throws If an error occurs while simulating the decision.
 */
export const postDecision = async (jsonFile: string, context: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(
      `/decisions/evaluateByFile/?ruleFileName=${encodeURIComponent(jsonFile)}`,
      {
        context,
        trace: true,
      }
    );
    return data;
  } catch (error) {
    console.error(`Error simulating decision: ${error}`);
    throw error;
  }
};

/**
 * Posts rule data to the API.
 * @param newRuleData The new rule data to post.
 * @returns The result of the post operation.
 * @throws If an error occurs while posting the rule data.
 */
export const postRuleData = async (newRuleData: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/ruleData`, newRuleData);
    return data;
  } catch (error) {
    console.error(`Error posting rule data: ${error}`);
    throw error;
  }
};

/**
 * Updates a rule in the API based on the provided rule ID.
 * @param ruleId The ID of the rule to update.
 * @param updatedRuleData The updated rule data.
 * @returns The result of the update.
 * @throws If an error occurs while updating the rule.
 */
export const updateRuleData = async (ruleId: string, updatedRuleData: unknown) => {
  try {
    const { data } = await axiosAPIInstance.put(`/ruleData/${ruleId}`, updatedRuleData);
    return data;
  } catch (error) {
    console.error(`Error updating rule: ${error}`);
    throw error;
  }
};

/**
 * Deletes a rule from the API based on the provided rule ID.
 * @param ruleId The ID of the rule to delete.
 * @returns The result of the deletion.
 * @throws If an error occurs while deleting the rule.
 */
export const deleteRuleData = async (ruleId: string) => {
  try {
    const { data } = await axiosAPIInstance.delete(`/ruleData/${ruleId}`);
    return data;
  } catch (error) {
    console.error(`Error deleting rule: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a rule map from the API based on the provided json filename.
 * @param goRulesJSONFilename The ID of the rule data to retrieve.
 * @returns The rule map.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleMapByName = async (goRulesJSONFilename: string): Promise<RuleMap> => {
  try {
    const { data } = await axiosAPIInstance.post(
      `/rulemap?goRulesJSONFilename=${encodeURIComponent(goRulesJSONFilename)}`
    );
    return data;
  } catch (error) {
    console.error(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Assess the rule response and return the schema based on a run of the rule.
 * @param ruleResponse The response from the rule evaluation. Assesses the trace response.
 * @returns The inputs and outputs schema.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleRunSchema = async (ruleResponse: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/rulemap/rulerunschema`, ruleResponse);
    return data;
  } catch (error) {
    console.error(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Retrieves the scenarios for a rule from the API based on the provided filename
 * @param goRulesJSONFilename The name of the rule data to retrieve.
 * @returns The scenarios for the rule.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getScenariosByFilename = async (goRulesJSONFilename: string) => {
  try {
    const { data } = await axiosAPIInstance.post("/scenario/by-filename/", { goRulesJSONFilename });
    return data;
  } catch (error) {
    console.error(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Creates a new scenario for a rule
 * @param scenarioResponse The response from scenario creation.
 * @returns The confirmation of rule posting.
 * @throws If an error occurs while retrieving the rule data.
 */
export const createScenario = async (scenarioResponse: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/scenario`, scenarioResponse);
    return data;
  } catch (error) {
    console.error(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Deletes a scenario by its ID
 * @param scenarioId The ID of the scenario to delete.
 * @returns The confirmation of scenario deletion.
 * @throws If an error occurs while deleting the scenario.
 */
export const deleteScenario = async (scenarioId: string) => {
  try {
    const { data } = await axiosAPIInstance.delete(`/scenario/${scenarioId}`);
    return data;
  } catch (error) {
    console.error(`Error deleting scenario: ${error}`);
    throw error;
  }
};
/**
 * Runs all scenarios against a rule and exports the results as a CSV.
 * @param goRulesJSONFilename The filename of the rule to evaluate scenarios against.
 * @returns The CSV data containing the results of the scenario evaluations.
 * @throws If an error occurs while running the scenarios or generating the CSV.
 */
export const runDecisionsForScenarios = async (goRulesJSONFilename: string) => {
  try {
    const { data } = await axiosAPIInstance.post("/scenario/run-decisions", { goRulesJSONFilename });
    return data;
  } catch (error) {
    console.error(`Error running scenarios: ${error}`);
    throw error;
  }
};

/**
 * Downloads a CSV file containing scenarios for a rule run.
 * @param goRulesJSONFilename The filename for the JSON rule.
 * @returns The processed CSV content as a string.
 * @throws If an error occurs during file upload or processing.
 */
export const getCSVForRuleRun = async (goRulesJSONFilename: string): Promise<string> => {
  try {
    const response = await axiosAPIInstance.post(
      "/scenario/evaluation",
      { goRulesJSONFilename: goRulesJSONFilename },
      {
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      }
    );

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${goRulesJSONFilename.replace(/\.json$/, ".csv")}`;
    a.click();
    window.URL.revokeObjectURL(url);

    return "CSV downloaded successfully";
  } catch (error) {
    console.error(`Error getting CSV for rule run: ${error}`);
    throw new Error("Error getting CSV for rule run");
  }
};

/**
 * Uploads a CSV file containing scenarios and processes the scenarios against the specified rule.
 * @param file The file to be uploaded.
 * @param goRulesJSONFilename The filename for the JSON rule.
 * @returns The processed CSV content as a string.
 * @throws If an error occurs during file upload or processing.
 */
export const uploadCSVAndProcess = async (file: File, goRulesJSONFilename: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("goRulesJSONFilename", goRulesJSONFilename);

  try {
    const response = await axiosAPIInstance.post(`/scenario/evaluation/upload/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\.\d+/, "");
    a.download = `${goRulesJSONFilename.replace(".json", "")}_testing_${file.name.replace(
      ".csv",
      ""
    )}_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    return "File processed successfully";
  } catch (error) {
    console.error(`Error processing CSV file: ${error}`);
    throw new Error("Error processing CSV file");
  }
};
