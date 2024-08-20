"use client";
import React, { createContext, useContext } from "react";
import { initializeGithubAxiosInstance } from "../utils/githubApi";

interface GithubAuthContextType {
  githubAuthToken?: string;
  githubAuthUsername?: string;
}

const GithubAuthContext = createContext<GithubAuthContextType | undefined>(undefined);

export const GithubAuthProvider: React.FC<{ authInfo: GithubAuthContextType; children: React.ReactNode }> = ({
  authInfo,
  children,
}) => {
  const { githubAuthToken, githubAuthUsername } = authInfo;
  initializeGithubAxiosInstance(githubAuthToken, githubAuthUsername);

  return <GithubAuthContext.Provider value={authInfo}>{children}</GithubAuthContext.Provider>;
};
