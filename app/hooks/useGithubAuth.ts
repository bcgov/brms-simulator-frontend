import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { isGithubAuthTokenValid, AuthFailureReasons } from "../utils/githubApi";
import { GithubAuthContextType } from "../components/GithubAuthProvider";

export default async function useGithubAuth(
  redirectPath: string,
  required: boolean = true
): Promise<GithubAuthContextType | null> {
  if (!required) {
    return null;
  }

  const githubAuthToken = cookies().get("github-authentication-token")?.value;
  const githubAuthUsername = cookies().get("github-authentication-username")?.value;
  const { valid, reason } = await isGithubAuthTokenValid(githubAuthToken);

  if (!valid) {
    const redirectURL = `${headers().get("x-forwarded-proto")}://${headers().get("host")}/${redirectPath}`;
    if (reason === AuthFailureReasons.NO_ORG_ACCESS) {
      redirect(`/errors/noorgaccess?returnUrl=${redirectURL}`);
    }
    redirect(`/auth/github?returnUrl=${redirectURL}`);
  }

  return { githubAuthToken, githubAuthUsername };
}
