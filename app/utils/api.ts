import { DecisionGraphType } from "@gorules/jdm-editor/dist/components/decision-graph/context/dg-store.context";
import axios from "axios";

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
export const getDocument = async (docId: string) => {
  try {
    const { data } = await goRulesAxiosInstance.get(`${GO_RULES_ROOT_PROJECT_URL}/documents/${docId}`);
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
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/submissions/list/${formId}`);
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
export const getSubmissionFromCHEFSById = async (id: string) => {
  try {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions: ${error}`);
    throw error;
  }
};
