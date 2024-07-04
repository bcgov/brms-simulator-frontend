import React, { useState, useEffect } from "react";
import { Button, Drawer, Flex, Select, Spin } from "antd";
import { DefaultOptionType } from "antd/es/cascader";
import { EditOutlined } from "@ant-design/icons";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import { getAllRuleData } from "@/app/utils/api";
import SimulationViewer from "../SimulationViewer";
import styles from "./LinkRuleComponent.module.css";

export default function LinkRuleComponent({ specification, id, isSelected, name }: GraphNodeProps) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const goRulesJSONFilename = node?.content?.key;

  const [openRuleDrawer, setOpenRuleDrawer] = useState(false);
  const [ruleOptions, setRuleOptions] = useState<DefaultOptionType[]>([]);

  useEffect(() => {
    const getRuleOptions = async () => {
      const ruleData = await getAllRuleData();
      setRuleOptions(
        ruleData.map(({ title, goRulesJSONFilename }) => ({
          label: title || goRulesJSONFilename,
          value: goRulesJSONFilename,
        }))
      );
    };
    if (openRuleDrawer) {
      getRuleOptions();
    }
  }, [openRuleDrawer]);

  const showRuleDrawer = () => {
    setOpenRuleDrawer(true);
  };

  const closeRuleDrawer = () => {
    setOpenRuleDrawer(false);
  };

  const onChangeSelection = (jsonFilename: string) => {
    // Update the graph with the jsonFilename. We use "key" to keep in line with how goRules handing linking rules
    updateNode(id, (draft) => {
      draft.content = { key: jsonFilename };
      return draft;
    });
  };

  const getShortFilenameOnly = (filepath: string, maxLength: number = 25) => {
    const filepathSections = filepath.split("/");
    const filename = filepathSections[filepathSections.length - 1];
    return filename.length > maxLength ? `${filename.substring(0, maxLength - 3)}...` : filename;
  };

  return (
    <GraphNode id={id} specification={specification} name={name} isSelected={isSelected}>
      <Button onClick={showRuleDrawer}>
        {goRulesJSONFilename ? getShortFilenameOnly(goRulesJSONFilename) : "Add rule"}
        <EditOutlined />
      </Button>
      <Drawer title={name} onClose={closeRuleDrawer} open={openRuleDrawer} width="80%">
        {ruleOptions ? (
          <>
            <Flex gap="small">
              <Select
                showSearch
                placeholder="Select rule"
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={ruleOptions}
                onChange={onChangeSelection}
                value={goRulesJSONFilename}
                className={styles.ruleSelect}
              />
              <Button onClick={closeRuleDrawer}>Done</Button>
            </Flex>
            {goRulesJSONFilename && <SimulationViewer jsonFile={goRulesJSONFilename} isEditable={false} />}
          </>
        ) : (
          <Spin tip="Loading rules..." size="large" className={styles.spinner}>
            <div className="content" />
          </Spin>
        )}
      </Drawer>
    </GraphNode>
  );
}
