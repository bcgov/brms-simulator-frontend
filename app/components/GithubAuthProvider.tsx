"use client";
import React, { createContext, useContext } from "react";
import { initializeGithubAxiosInstance } from "../utils/githubApi";

export interface GithubAuthContextType {
  githubAuthToken?: string;
  githubAuthUsername?: string;
}

const GithubAuthContext = createContext<GithubAuthContextType | undefined>(undefined);

export const GithubAuthProvider: React.FC<{ authInfo: GithubAuthContextType | null; children: React.ReactNode }> = ({
  authInfo,
  children,
}) => {
  // If no auth information, just return children
  if (!authInfo) {
    return <>{children}</>;
  }

  const { githubAuthToken, githubAuthUsername } = authInfo;
  initializeGithubAxiosInstance(githubAuthToken, githubAuthUsername);

  return <GithubAuthContext.Provider value={authInfo}>{children}</GithubAuthContext.Provider>;
};
