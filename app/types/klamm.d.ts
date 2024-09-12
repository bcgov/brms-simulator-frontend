export interface KlammBREField {
  id?: string;
  name: string;
  label: string;
  description?: string;
  data_type?: {
    name: string;
  };
  data_validation?: {
    validation_criteria: string;
    bre_validation_type: {
      value: string;
    };
  };
}
