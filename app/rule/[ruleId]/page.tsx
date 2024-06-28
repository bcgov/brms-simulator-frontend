import RuleHeader from "@/app/components/RuleHeader";
import SimulationViewer from "../../components/SimulationViewer";
import { getRuleDataById } from "../../utils/api";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const ruleInfo = await getRuleDataById(ruleId);
  const { _id, goRulesJSONFilename, chefsFormId } = ruleInfo;

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return (
    <>
      <RuleHeader ruleInfo={ruleInfo} />
      <SimulationViewer jsonFile={goRulesJSONFilename} chefsFormId={chefsFormId} />
    </>
  );
}
