import { getScenariosByFilename, getRuleDataById } from "@/app/utils/api";
import RuleHeader from "@/app/components/RuleHeader";
import SimulationViewer from "@/app/components/SimulationViewer";
import { Scenario } from "@/app/types/scenario";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import useGithubAuth from "@/app/hooks/useGithubAuth";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const ruleInfo = await getRuleDataById(ruleId);
  const { _id, goRulesJSONFilename } = ruleInfo;
  const scenarios: Scenario[] = await getScenariosByFilename(goRulesJSONFilename);

  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const { githubAuthToken, githubAuthUsername } = await useGithubAuth(`rule/${ruleId}`);

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return (
    <GithubAuthProvider authInfo={{ githubAuthToken, githubAuthUsername }}>
      <RuleHeader ruleInfo={ruleInfo} />
      <SimulationViewer ruleId={_id} jsonFile={goRulesJSONFilename} scenarios={scenarios} editing />
    </GithubAuthProvider>
  );
}
