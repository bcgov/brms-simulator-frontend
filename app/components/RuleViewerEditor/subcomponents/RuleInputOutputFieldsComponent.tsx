import React, { useState, useEffect } from "react";
import { Button, List, Select, Spin, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { BaseOptionType } from "antd/es/select";
import type { FlattenOptionData } from "rc-select/lib/interface";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import { SchemaSelectProps } from "@gorules/jdm-editor/src/helpers/components";
import { KlammBREField } from "@/app/types/klamm";
import { getBREFields } from "@/app/utils/api";
import styles from "./RuleInputOutputFieldsComponent.module.css";

declare type InputOutputField = {
  id?: string;
  field: string;
  label?: string;
  type?: string;
  value?: string;
};

interface RuleInputOutputFieldsComponent extends GraphNodeProps {
  fieldsTypeLabel: string;
  setInputOutputSchema: (schema: SchemaSelectProps[]) => void;
  isEditable: boolean;
  contextToSimulate?: Record<string, any> | null;
  resultsOfSimulation?: Record<string, any> | null;
  setContextToSimulate?: (results: Record<string, any>) => void;
  schemaContext?: Record<string, any>;
  setSchemaContext?: (results: Record<string, any>) => void;
}

export default function RuleInputOutputFieldsComponent({
  specification,
  id,
  isSelected,
  name,
  fieldsTypeLabel = "Input",
  setInputOutputSchema,
  isEditable,
  contextToSimulate,
  resultsOfSimulation,
  setContextToSimulate,
  schemaContext,
  setSchemaContext,
}: RuleInputOutputFieldsComponent) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const inputOutputFields: InputOutputField[] = node?.content?.fields || [];

  const [inputOutputOptions, setInputOutputOptions] = useState<BaseOptionType[]>([]);
  const [inputOutputSchemaFields, setInputOutputSchemaFields] = useState<any>(contextToSimulate || {});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFieldsFromKlamm = async () => {
      try {
        const data: KlammBREField[] = await getBREFields();
        const newInputOutputOptions: BaseOptionType[] = data.map(({ id, name, label, description }) => ({
          label: `${label}${description ? `: ${description}` : ""}`, // Add the description as part of the label - will be formatted properly later
          value: name,
        }));

        const variables = Object.entries(contextToSimulate || {})
          .filter(([name]) => name !== "rulemap")
          .map(([name]) => ({ label: `${name}`, value: name }));

        const expectedResults = Object.entries(resultsOfSimulation || {})
          .filter(([name]) => name !== "rulemap")
          .map(([name]) => ({ label: `${name}`, value: name }));

        setInputOutputSchemaFields(fieldsTypeLabel === "Input" ? variables : expectedResults);
        setInputOutputOptions(newInputOutputOptions);
        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    getFieldsFromKlamm();
  }, [contextToSimulate, resultsOfSimulation, fieldsTypeLabel]);

  useEffect(() => {
    // Add a new field by default if one doesn't exist when editing
    if (isEditable && inputOutputFields?.length == 0) {
      updateNode(id, (draft) => {
        draft.content = { fields: [{ id: crypto.randomUUID(), field: "" }] };
        return draft;
      });
      inputOutputFields.forEach((field) => {
        setSchemaContext?.((prevContext: any) => ({
          ...prevContext,
          [field.field]: field,
        }));
      });
    }
  }, []);

  useEffect(() => {
    if (inputOutputFields?.length == 0) return;
    // Map the fields from the schema - basically just converting label to name
    const schemafiedInputs = inputOutputFields
      .filter(({ field }) => field)
      .map(({ field, label }) => ({ field, name: label }));
    setInputOutputSchema(schemafiedInputs);
  }, [inputOutputFields]);

  const addInputField = () => {
    updateNode(id, (draft) => {
      if (!draft.content?.fields) {
        draft.content = { fields: [] };
      }
      draft.content.fields.push({ id: crypto.randomUUID(), field: "" });
      return draft;
    });
  };

  const updateInputField = (item: InputOutputField, { key, label }: any) => {
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
        if (input.id === item.id) {
          input.field = key;
          input.label = label;
        }
        return input;
      });
      return draft;
    });
  };

  const updateInputFieldMatch = (item: InputOutputField, { value }: any) => {
    setSchemaContext?.((prevContext: any) => ({
      ...prevContext,
      [value]: item,
    }));
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
        if (input.id === item.id) {
          input.value = value;
        }
        return input;
      });
      return draft;
    });
  };

  const deleteInputField = (item: InputOutputField) => {
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.filter((input: InputOutputField) => input.id !== item.id);
      return draft;
    });
  };

  const filterOption = (inputValue: string, option?: BaseOptionType) =>
    (option?.label ?? "").toString().toLowerCase().includes(inputValue.toLowerCase());

  const renderSelectLabel = ({ label }: { label: React.ReactNode }) => {
    if (!label) {
      return null;
    }
    const [name] = label?.toString().split(":"); // first part of label is the name (don't want description here)
    return name;
  };

  const renderSelectOption = ({ label }: FlattenOptionData<BaseOptionType>) => {
    if (!label) {
      return null;
    }
    const [name, description] = label?.toString().split(":");
    return (
      <>
        <span>{name}</span>
        {description ? <span className={styles.selectDescription}>{description}</span> : ""}
      </>
    );
  };

  const renderLabel = (label: string) => {
    const [name, description] = label?.toString().split(":");
    return (
      <Tooltip title={description} placement="left">
        <span>{name}</span>
      </Tooltip>
    );
  };

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={name}
      isSelected={isSelected}
      actions={
        isEditable
          ? [
              <Button key="add row" type="link" onClick={addInputField} disabled={!isEditable}>
                Add {fieldsTypeLabel} +
              </Button>,
            ]
          : []
      }
    >
      {inputOutputFields && inputOutputFields.length > 0 && (
        <List
          size="small"
          dataSource={inputOutputFields}
          renderItem={(item) => (
            <List.Item>
              {isEditable ? (
                <>
                  <Select
                    disabled={!isEditable}
                    showSearch
                    placeholder="Select rule"
                    filterOption={filterOption}
                    options={inputOutputOptions}
                    onChange={(value) => updateInputField(item, value)}
                    value={{ label: item.label, value: item.field }}
                    notFoundContent={isLoading ? <Spin size="small" /> : null}
                    style={{ width: 200 }}
                    popupMatchSelectWidth={false}
                    className={styles.inputSelect}
                    labelInValue
                    labelRender={renderSelectLabel}
                    optionRender={renderSelectOption}
                  />
                  <Select
                    disabled={!isEditable}
                    showSearch
                    placeholder={`Select matching ${fieldsTypeLabel}`}
                    // filterOption={filterOption}
                    options={inputOutputSchemaFields}
                    onChange={(value) => updateInputFieldMatch(item, value)}
                    value={{ label: item.value, value: item.value }}
                    notFoundContent={isLoading ? <Spin size="small" /> : null}
                    // style={{ width: 200 }}
                    popupMatchSelectWidth={false}
                    className={styles.inputSelect}
                    labelInValue
                    // labelRender={renderSelectLabel}
                    // optionRender={renderSelectOption}
                  />

                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ marginLeft: "4px" }}
                    onClick={() => deleteInputField(item)}
                    disabled={!isEditable}
                  />
                </>
              ) : (
                item.label && <span>{renderLabel(item.label)}</span>
              )}
            </List.Item>
          )}
        />
      )}
    </GraphNode>
  );
}
