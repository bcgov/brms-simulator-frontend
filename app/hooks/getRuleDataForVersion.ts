import { RuleInfo } from "../types/ruleInfo";
import { RULE_VERSION } from "../constants/ruleVersion";
import { getFileAsJsonIfAlreadyExists } from "../utils/githubApi";
import { getRuleDraft, getDocument, getRuleDataById } from "../utils/api";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";

export default async function getRuleDataForVersion(ruleId: string, version?: string) {
  // Get rule data
  const ruleInfo: RuleInfo = await getRuleDataById(ruleId);

  // Get the rule content based on version and ruleInfo
  let ruleContent;
  try {
    switch (version) {
      case RULE_VERSION.draft:
        const draft = await getRuleDraft(ruleId);
        ruleContent = draft?.content;
        // If no current draft, create one using what's currently published as a base
        if (!ruleContent) {
          ruleContent = await getPublishedRuleContentOrDefault(ruleInfo);
        }
        break;
      case RULE_VERSION.inReview:
        if (!ruleInfo.reviewBranch) {
          throw new Error("No branch in review");
        }
        ruleContent = await getFileAsJsonIfAlreadyExists(ruleInfo.reviewBranch, ruleInfo.goRulesJSONFilename);
        break;
      default:
        ruleContent = await getDocument(ruleInfo.goRulesJSONFilename);
    }
  } catch (error) {
    console.error("Error fetching rule content:", error);
  }

  return { ruleInfo, ruleContent };
}

async function getPublishedRuleContentOrDefault(ruleInfo: RuleInfo) {
  if (ruleInfo.goRulesJSONFilename) {
    return await getDocument(ruleInfo.goRulesJSONFilename);
  }
  return DEFAULT_RULE_CONTENT;
}
