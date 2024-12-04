import { Metadata } from "next";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import getGithubAuth from "@/app/utils/getGithubAuth";
import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import RuleHeader from "@/app/components/RuleHeader";
import RuleManager from "@/app/components/RuleManager";
import styles from "@/app/rule/rule.module.css";

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
  const defaultVersion =
    process.env.NEXT_PUBLIC_IN_PRODUCTION === "true" ? RULE_VERSION.inProduction : RULE_VERSION.inDev;

  const version = searchParams.version?.trim() || defaultVersion;

  const oAuthRequired = version === RULE_VERSION.draft; // only require oauth if editing a draft
  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const githubAuthInfo = await getGithubAuth(`rule/${ruleId}?version=${version}`, oAuthRequired);

  // Get rule details and json content for the rule id
  const { ruleInfo, ruleContent } = await getRuleDataForVersion(ruleId, version);
  if (!ruleInfo._id || !ruleContent) {
    return <h1>Rule not found</h1>;
  }

  return (
    <GithubAuthProvider authInfo={githubAuthInfo}>
      <RuleHeader ruleInfo={ruleInfo} />
      <div className={styles.rootLayout} style={{ background: "white" }}>
        <div className={styles.rulesWrapper}>
          <RuleManager ruleInfo={ruleInfo} initialRuleContent={ruleContent} editing={version} />
        </div>
      </div>
    </GithubAuthProvider>
  );
}
