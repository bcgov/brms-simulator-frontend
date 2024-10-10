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

export interface CategoryObject {
  text: string;
  value: string;
}

export interface RuleDataResponse {
  data: RuleInfo[];
  total: number;
  categories: Array<CategoryObject>;
}
