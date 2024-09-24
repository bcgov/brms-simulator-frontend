import React from "react";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import styles from "./NotesComponent.module.css";
import TextArea from "antd/es/input/TextArea";

interface NotesComponent extends GraphNodeProps {
  isEditable: boolean;
}

export default function NotesComponent({ specification, id, isSelected, name, isEditable }: NotesComponent) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const note = node?.content?.config?.value;

  const onChangeSelection = (updatedNoteValue: string) => {
    updateNode(id, (draft) => {
      draft.content.config.value = updatedNoteValue;
      return draft;
    });
  };

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={name}
      isSelected={isSelected}
      className={styles.note}
      noBodyPadding
      handleLeft={false}
      handleRight={false}
    >
      <TextArea
        disabled={!isEditable}
        autoSize={{ minRows: 3, maxRows: 6 }}
        onChange={(e) => onChangeSelection(e.target.value)}
        value={note}
      />
    </GraphNode>
  );
}
