import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { isGithubAuthTokenValid, initializeGithubAxiosInstance } from "../utils/githubApi";

export default async function useGithubAuth(redirectPath: string) {
  const githubAuthToken = cookies().get("github-authentication-token")?.value;
  const githubAuthUsername = cookies().get("github-authentication-username")?.value;
  const validToken = githubAuthToken ? await isGithubAuthTokenValid(githubAuthToken) : false;

  if (!validToken) {
    const redirectURL = `${headers().get("x-forwarded-proto")}://${headers().get("host")}/${redirectPath}`;
    redirect(`/auth/github?returnUrl=${redirectURL}`);
  }

  initializeGithubAxiosInstance(githubAuthToken, githubAuthUsername);

  return { githubAuthToken, githubAuthUsername };
}
