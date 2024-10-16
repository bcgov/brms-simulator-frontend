import { Metadata } from "next";
import { getScenariosByFilename } from "@/app/utils/api";
import RuleHeader from "@/app/components/RuleHeader";
import RuleManager from "@/app/components/RuleManager";
import { Scenario } from "@/app/types/scenario";
import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import useGithubAuth from "@/app/hooks/useGithubAuth";

type Props = {
  params: { ruleId: string };
  searchParams: { version?: string };
};

// Update page title with rule name
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { ruleId } = params;
  const { version } = searchParams;

  const { ruleInfo } = await getRuleDataForVersion(ruleId, version);

  return {
    title: ruleInfo.title,
  };
}

export default async function Rule({ params: { ruleId }, searchParams }: Props) {
  // Get version of rule to use
  const { version } = searchParams;

  const oAuthRequired = version === RULE_VERSION.draft; // only require oauth if editing a draft
  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const githubAuthInfo = await useGithubAuth(`rule/${ruleId}?version=${version}`, oAuthRequired);

  // Get rule details and json content for the rule id
  const { ruleInfo, ruleContent } = await getRuleDataForVersion(ruleId, version);

  if (!ruleInfo._id || !ruleContent) {
    return <h1>Rule not found</h1>;
  }

  // Get scenario information
  const scenarios: Scenario[] = await getScenariosByFilename(ruleInfo.filepath);

  return (
    <GithubAuthProvider authInfo={githubAuthInfo}>
      <RuleHeader ruleInfo={ruleInfo} version={version} />
      <RuleManager ruleInfo={ruleInfo} initialRuleContent={ruleContent} scenarios={scenarios} editing={version} />
    </GithubAuthProvider>
  );
}
