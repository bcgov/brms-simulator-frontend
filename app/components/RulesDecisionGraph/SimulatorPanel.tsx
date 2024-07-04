import React from "react";
import JSON5 from "json5";
import { GraphSimulator } from "@gorules/jdm-editor";
import { SubmissionData } from "@/app/types/submission";

interface SimulatorPanelProps {
  contextToSimulate?: SubmissionData | null;
  setContextToSimulate: (results: Record<string, any>) => void;
  runSimulation: (results: unknown) => void;
}

export default function SimulatorPanel({
  contextToSimulate,
  runSimulation,
  setContextToSimulate,
}: SimulatorPanelProps) {
  return (
    <GraphSimulator
      defaultRequest={JSON5.stringify(contextToSimulate)}
      onRun={({ context }: { context: unknown }) => runSimulation(context)}
      onClear={() => setContextToSimulate({})}
    />
  );
}
