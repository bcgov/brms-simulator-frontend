import { FilterValue } from "antd/es/table/interface";

export interface RuleQuery {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue, null> | undefined;
  searchTerm?: string;
}
