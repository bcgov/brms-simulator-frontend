import SimulationViewer from "../../../components/SimulationViewer";
import { getRuleDataById } from "../../../utils/api";

export default async function RuleEmbedded({ params: { ruleId } }: { params: { ruleId: string } }) {
  const { _id, goRulesJSONFilename, chefsFormId } = await getRuleDataById(ruleId);

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return <SimulationViewer jsonFile={goRulesJSONFilename} chefsFormId={chefsFormId} />;
}
