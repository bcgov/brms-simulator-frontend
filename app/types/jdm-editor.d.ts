// These used to be imported from the jdm editor itself, but that caused build problems

export type SchemaSelectProps = {
  field: string;
  name?: string;
  items?: SchemaSelectProps[];
};

export type PanelType = {
  id: string;
  icon: React.ReactNode;
  title: string;
  renderPanel?: React.FC;
  onClick?: () => void;
};
