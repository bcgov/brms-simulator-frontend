import { Metadata } from "next";
import getGithubAuth from "@/app/utils/getGithubAuth";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import NewRule from "./NewRule";

export default async function NewRuleWrapper() {
  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const githubAuthInfo = await getGithubAuth("rule/new");

  return (
    <GithubAuthProvider authInfo={githubAuthInfo}>
      <NewRule />
    </GithubAuthProvider>
  );
}

export const metadata: Metadata = {
  title: "New Rule",
};
