import React, { useState, useEffect } from "react";
import { Button, List, Select, Spin, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { DefaultOptionType } from "antd/es/select";
import type { FlattenOptionData } from "rc-select/lib/interface";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import { SchemaSelectProps } from "@/app/types/jdm-editor";
import { KlammBREField } from "@/app/types/klamm";
import { getBREFields, getBREFieldFromName } from "@/app/utils/api";
import styles from "./RuleInputOutputFieldsComponent.module.css";

declare type InputOutputField = {
  id?: string;
  field: string;
  name?: string;
  description?: string;
  dataType?: string;
  validationCriteria?: string;
  validationType?: string;
  child_fields?: InputOutputField[];
};

interface RuleInputOutputFieldsComponent extends GraphNodeProps {
  fieldsTypeLabel: string;
  setInputOutputSchema: (schema: SchemaSelectProps[]) => void;
  isEditable: boolean;
}

export default function RuleInputOutputFieldsComponent({
  specification,
  id,
  isSelected,
  name,
  fieldsTypeLabel = "Input",
  setInputOutputSchema,
  isEditable,
}: RuleInputOutputFieldsComponent) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const inputOutputFields: InputOutputField[] = node?.content?.fields || [];

  const [inputOutputOptions, setInputOutputOptions] = useState<DefaultOptionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFieldsFromKlamm = async () => {
      try {
        const data: KlammBREField[] = await getBREFields();
        const newInputOutputOptions: DefaultOptionType[] = data.map(({ name, label, description }) => ({
          label: `${label}${description ? `: ${description}` : ""}`, // Add the description as part of the label - will be formatted properly later
          value: name,
        }));
        setInputOutputOptions(newInputOutputOptions);
        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    getFieldsFromKlamm();
  }, []);

  useEffect(() => {
    // Add a new field by default if one doesn't exist when editing
    if (isEditable && inputOutputFields?.length == 0) {
      updateNode(id, (draft) => {
        draft.content = { fields: [{ name: "" }] };
        return draft;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inputOutputFields?.length == 0) return;
    // Map the fields from the schema
    const schemafiedInputs = inputOutputFields.filter(({ field }) => field).map(({ field, name }) => ({ field, name }));
    setInputOutputSchema(schemafiedInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputOutputFields]);

  const addInputField = () => {
    updateNode(id, (draft) => {
      if (!draft.content?.fields) {
        draft.content = { fields: [] };
      }
      draft.content.fields.push({ name: "" });
      return draft;
    });
  };

  const updateInputField = async (item: InputOutputField, { value, label }: any) => {
    // Get the actual values from the ids
    // TODO: potentially add loading feedback when this is being fetched
    const data: KlammBREField = await getBREFieldFromName(value);
    // Update the node with the information we want to store in the json
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
        console.log(input.id, item.id, data.id);
        if (input.id === item.id) {
          // Get important bits of data to store in json
          input.id = data.id;
          input.field = data.name;
          input.name = data.label;
          input.description = data.description;
          input.dataType = data?.data_type?.name;
          input.validationCriteria = data?.data_validation?.validation_criteria;
          input.validationType = data?.data_validation?.bre_validation_type?.value;
          // Check if data type is 'object-array'
          if (data?.data_type?.name === "object-array") {
            input.child_fields =
              data?.child_fields &&
              data?.child_fields.map((child) => ({
                id: child.id,
                name: child.name,
                label: child.label,
                description: child.description,
                dataType: child?.bre_data_type?.name,
                validationCriteria: child?.bre_data_validation?.validation_criteria,
                validationType: child?.bre_data_validation?.bre_validation_type?.value,
              }));
          } else {
            input.child_fields = [];
          }
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

  const filterOption = (inputValue: string, option?: DefaultOptionType) =>
    (option?.label ?? "").toString().toLowerCase().includes(inputValue.toLowerCase());

  const renderSelectLabel = ({ label }: { label: React.ReactNode }) => {
    if (!label) {
      return null;
    }
    const [name] = label?.toString().split(":"); // first part of label is the name (don't want description here)
    return name;
  };

  const renderSelectOption = ({ label }: FlattenOptionData<DefaultOptionType>) => {
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
                    value={{ label: item.name, value: item.field }}
                    notFoundContent={isLoading ? <Spin size="small" /> : null}
                    style={{ width: 200 }}
                    popupMatchSelectWidth={false}
                    className={styles.inputSelect}
                    labelInValue
                    labelRender={renderSelectLabel}
                    optionRender={renderSelectOption}
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
                item.name && <span>{renderLabel(item.name)}</span>
              )}
            </List.Item>
          )}
        />
      )}
    </GraphNode>
  );
}
