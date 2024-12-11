import React, { createContext, useContext, useState } from "react";
import { RuleNode } from "@/app/types/rulemap";

interface RuleModalContextType {
  selectedRule: RuleNode | null;
  openModal: (rule: RuleNode) => void;
  closeModal: () => void;
}

const RuleModalContext = createContext<RuleModalContextType | null>(null);

export const RuleModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRule, setSelectedRule] = useState<RuleNode | null>(null);

  const openModal = (rule: RuleNode) => {
    setSelectedRule(rule);
  };

  const closeModal = () => {
    setSelectedRule(null);
  };

  return (
    <RuleModalContext.Provider value={{ selectedRule, openModal, closeModal }}>{children}</RuleModalContext.Provider>
  );
};

export const useRuleModal = () => {
  const context = useContext(RuleModalContext);
  if (!context) {
    throw new Error("useRuleModal must be used within a RuleModalProvider");
  }
  return context;
};
