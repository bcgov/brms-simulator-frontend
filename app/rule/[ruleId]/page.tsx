import RuleHeader from "@/app/components/RuleHeader";
import SimulationViewer from "../../components/SimulationViewer";
import { getRuleDataById, getRuleMapByName, getScenariosByFilename } from "../../utils/api";
import { RuleMap } from "@/app/types/rulemap";
import { Scenario } from "@/app/types/scenario";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const ruleInfo = await getRuleDataById(ruleId);
  const { _id, goRulesJSONFilename } = ruleInfo;
  const rulemap: RuleMap = await getRuleMapByName(goRulesJSONFilename);
  const scenarios: Scenario[] = await getScenariosByFilename(goRulesJSONFilename);

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return (
    <>
      <RuleHeader ruleInfo={ruleInfo} />
      <SimulationViewer
        ruleId={ruleId}
        rulemap={rulemap}
        jsonFile={goRulesJSONFilename}
        scenarios={scenarios}
        isEditable
      />
    </>
  );
}
