import { Variable } from "./scenario";
export interface RuleMap {
  inputs: Variable[];
  outputs: Variable[];
  resultOutputs: Variable[];
}

export interface Rule {
  id: number;
  name: string;
  label: string;
  child_rules: Rule[];
  parent_rules: Rule[];
  description: string | null;
  url: string | undefined;
  filepath: string | undefined;
}

export interface RuleNode extends d3.SimulationNodeDatum {
  id: number;
  name: string;
  label: string;
  radius: number;
  isHighlighted?: boolean;
  description: string | null;
  url: string | undefined;
  filepath: string | undefined;
}

export interface RuleLink extends d3.SimulationLinkDatum<RuleNode> {
  source: number;
  target: number;
}
