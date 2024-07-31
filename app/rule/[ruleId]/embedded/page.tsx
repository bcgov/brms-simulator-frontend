import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import SimulationViewer from "../../../components/SimulationViewer";
import { getScenariosByFilename } from "../../../utils/api";
import { Scenario } from "@/app/types/scenario";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  // Get rule details and json content for the rule id
  const { ruleInfo, ruleContent } = await getRuleDataForVersion(ruleId, RULE_VERSION.published);

  if (!ruleInfo._id || !ruleContent) {
    return <h1>Rule not found</h1>;
  }
  // Get scenario information
  const scenarios: Scenario[] = await getScenariosByFilename(ruleInfo.goRulesJSONFilename);

  return (
    <SimulationViewer ruleInfo={ruleInfo} initialRuleContent={ruleContent} scenarios={scenarios} editing={false} />
  );
}
