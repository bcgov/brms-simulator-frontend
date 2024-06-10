import { DecisionGraphType } from "@gorules/jdm-editor/dist/components/decision-graph/context/dg-store.context";
import axios from "axios";
import { RuleInfo } from "../types/ruleInfo";
import { RuleMap } from "../types/rulemap";

// For server side calls, need full URL, otherwise can just use /api
const API_URI = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "/api";

const GO_RULES_ROOT_PROJECT_URL = `https://sdpr.gorules.io/api/projects/${process.env.NEXT_PUBLIC_GO_RULES_PROJECT_ID}`;

const goRulesAxiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_GO_RULES_BEARER_PAT}`,
    "x-access-token": process.env.NEXT_PUBLIC_GO_RULES_ACCESS_TOKEN,
  },
});

/**
 * Retrieves a document from the GoRules API based on the provided document ID.
 * @param docId The ID of the document to retrieve.
 * @returns The content of the document.
 * @throws If an error occurs while retrieving the document.
 */
export const getDocument = async (docId: string): Promise<DecisionGraphType> => {
  try {
    const { data } = await goRulesAxiosInstance.get(`${GO_RULES_ROOT_PROJECT_URL}/documents/${docId}`);
    if (!data.versions || !data.versions[0] || !data.versions[0].content) {
      throw new Error("Unexpected format of the returned data");
    }
    return data.versions[0].content;
  } catch (error) {
    console.error(`Error getting the gorules document: ${error}`);
    throw error;
  }
};

/**
 * Posts a decision to the GoRules API for evaluation.
 * @param jsonFile The JSON file to use for the decision.
 * @param decisionGraph The decision graph to evaluate.
 * @param context The context for the decision evaluation.
 * @returns The result of the decision evaluation.
 * @throws If an error occurs while simulating the decision.
 */
export const postDecision = async (jsonFile: string, decisionGraph: DecisionGraphType, context: unknown) => {
  try {
    const { data } = await goRulesAxiosInstance.post(`${GO_RULES_ROOT_PROJECT_URL}/evaluate/${jsonFile}`, {
      context,
      trace: true,
      content: decisionGraph,
    });
    return data;
  } catch (error) {
    console.error(`Error simulating decision: ${error}`);
    throw error;
  }
};

/**
 * Retrieves submissions from the CHEFS API.
 * @returns The submissions data.
 * @throws If an error occurs while fetching the submissions.
 */
export const getSubmissionsFromCHEFS = async (formId: string) => {
  try {
    const { data } = await axios.get(`${API_URI}/submissions/list/${formId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions: ${error}`);
    throw error;
  }
};

/**
 * Retrieves submissions from the CHEFS API.
 * @returns The submissions data.
 * @throws If an error occurs while fetching the submissions.
 */
export const getSubmissionFromCHEFSById = async (formId: string, id: string) => {
  try {
    const { data } = await axios.get(`${API_URI}/submissions/${formId}/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a rule data from the API based on the provided rule ID.
 * @param ruleId The ID of the rule data to retrieve.
 * @returns The rule data.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleDataById = async (ruleId: string): Promise<RuleInfo> => {
  try {
    const { data } = await axios.get(`${API_URI}/ruleData/${ruleId}`);
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
    const { data } = await axios.get(`${API_URI}/ruleData/list`);
    return data;
  } catch (error) {
    console.error(`Error fetching rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a rule map from the API based on the provided rule ID.
 * @param ruleId The ID of the rule data to retrieve.
 * @returns The rule map.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleMapByName = async (goRulesJSONFilename: string): Promise<RuleMap> => {
  try {
    const { data } = await axios.get(`${API_URI}/rulemap/${goRulesJSONFilename}`);
    return data;
  } catch (error) {
    console.error(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Assess the rule response and return the output schema.
 * @param ruleResponse The response from the rule evaluation.
 * @returns The output schema.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getOutputSchema = async (ruleResponse: unknown) => {
  try {
    const { data } = await axios.post(`${API_URI}/rulemap/outputschema`, ruleResponse);
    return data;
  } catch (error) {
    console.error(`Error posting output schema: ${error}`);
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
    const { data } = await axios.post(`${API_URI}/ruleData`, newRuleData);
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
    const { data } = await axios.put(`${API_URI}/ruleData/${ruleId}`, updatedRuleData);
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
    const { data } = await axios.delete(`${API_URI}/ruleData/${ruleId}`);
    return data;
  } catch (error) {
    console.error(`Error deleting rule: ${error}`);
    throw error;
  }
};
