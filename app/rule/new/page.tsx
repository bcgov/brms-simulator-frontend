import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import useGithubAuth from "@/app/hooks/useGithubAuth";
import NewRule from "./NewRule";

export default async function NewRuleWrapper() {
  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const { githubAuthToken, githubAuthUsername } = await useGithubAuth("rule/new");

  return (
    <GithubAuthProvider authInfo={{ githubAuthToken, githubAuthUsername }}>
      <NewRule />
    </GithubAuthProvider>
  );
}
