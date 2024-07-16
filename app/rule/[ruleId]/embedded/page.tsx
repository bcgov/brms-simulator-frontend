import SimulationViewer from "../../../components/SimulationViewer";
import { getRuleDataById, getScenariosByFilename } from "../../../utils/api";
import { Scenario } from "@/app/types/scenario";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const { _id, goRulesJSONFilename } = await getRuleDataById(ruleId);
  const scenarios: Scenario[] = await getScenariosByFilename(goRulesJSONFilename);

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return <SimulationViewer ruleId={ruleId} jsonFile={goRulesJSONFilename} scenarios={scenarios} editing={false} />;
}
