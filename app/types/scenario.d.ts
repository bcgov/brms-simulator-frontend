export interface Scenario {
  _id: string;
  title: string;
  ruleID: string;
  goRulesJsonFilename: string;
  variables: any[];
}

export interface Variable {
  name: string;
  value: any;
  type: string;
}
