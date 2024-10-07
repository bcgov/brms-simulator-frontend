export interface RuleDraft {
  _id: string;
  content: DecisionGraphType;
}

export interface RuleInfoBasic {
  _id: string;
  name?: string;
  title?: string;
  filepath: string;
}

export interface RuleInfo extends RuleInfoBasic {
  ruleDraft?: RuleDraft;
  reviewBranch?: string;
  isPublished?: boolean;
}
