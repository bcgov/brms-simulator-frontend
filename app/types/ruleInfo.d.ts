export interface RuleDraft {
  _id: string;
  content: DecisionGraphType;
}

export interface RuleInfo {
  _id: string;
  title?: string;
  goRulesJSONFilename: string;
  ruleDraft?: RuleDraft;
  reviewBranch?: string;
}
