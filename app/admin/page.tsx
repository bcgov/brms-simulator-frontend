"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Input, Button, Flex } from "antd";
import { ColumnsType } from "antd/es/table";
import { HomeOutlined } from "@ant-design/icons";
import { RuleInfo } from "../types/ruleInfo";
import { getAllRuleData, postRuleData, updateRuleData, deleteRuleData } from "../utils/api";

enum ACTION_STATUS {
  NEW = "new",
  UPDATE = "update",
  DELETE = "delete",
}

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRules, setInitialRules] = useState<RuleInfo[]>([]);
  const [rules, setRules] = useState<RuleInfo[]>([]);

  const getOrRefreshRuleList = async () => {
    // Get rules that are already defined in the DB
    const existingRules = await getAllRuleData();
    setInitialRules(existingRules);
    setRules(JSON.parse(JSON.stringify([...existingRules]))); // JSON.parse(JSON.stringify(data)) is a hacky way to deep copy the data - needed for comparison later
    setIsLoading(false);
  };

  useEffect(() => {
    getOrRefreshRuleList();
  }, []);

  const updateRule = (e: React.ChangeEvent<HTMLInputElement>, index: number, property: keyof RuleInfo) => {
    const newRules = [...rules];
    if (property === "ruleDraft") {
      throw new Error("Can't update the draft this way");
    }
    newRules[index][property] = e.target.value;
    setRules(newRules);
  };

  const deleteRule = async (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  // Get a list of rules that have been locally updated or deleted
  const getRulesToUpdate = (): { rule: RuleInfo; action: ACTION_STATUS }[] => {
    const updatedEntries = rules
      .map((rule) => {
        const initialRule = initialRules.find((r) => r._id === rule._id);
        if (!initialRule) {
          return { rule, action: ACTION_STATUS.NEW };
        } else if (
          initialRule._id !== rule._id ||
          initialRule.title !== rule.title ||
          initialRule.goRulesJSONFilename !== rule.goRulesJSONFilename
        ) {
          return { rule, action: ACTION_STATUS.UPDATE };
        }
      })
      .filter(Boolean) as { rule: RuleInfo; action: ACTION_STATUS }[];
    const deletedEntries = initialRules
      .filter((initialRule) => !rules.find((rule) => rule._id === initialRule._id))
      .map((rule) => ({ rule, action: ACTION_STATUS.DELETE }));
    return [...updatedEntries, ...deletedEntries];
  };

  // Save all rule updates to the API/DB
  const saveAllRuleUpdates = async () => {
    setIsLoading(true);
    const entriesToUpdate = getRulesToUpdate();
    await Promise.all(
      entriesToUpdate.map(async ({ rule, action }) => {
        try {
          if (action === ACTION_STATUS.NEW) {
            await postRuleData(rule);
          } else if (rule?._id) {
            if (action === ACTION_STATUS.UPDATE) {
              await updateRuleData(rule._id, rule);
            } else if (action === ACTION_STATUS.DELETE) {
              await deleteRuleData(rule._id);
            }
          }
        } catch (error) {
          console.error(`Error performing action ${action} on rule ${rule._id}: ${error}`);
        }
      })
    );
    getOrRefreshRuleList();
  };

  const renderInputField = (fieldName: keyof RuleInfo) => {
    const Component = (value: string, _: RuleInfo, index: number) => (
      <Input value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(e, index, fieldName)} />
    );
    Component.displayName = "InputField";
    return Component;
  };

  const columns: ColumnsType<RuleInfo> = [
    {
      title: "Title",
      dataIndex: "title",
      render: renderInputField("title"),
      width: "220px",
    },
    {
      title: "GoRules JSON Filename",
      dataIndex: "goRulesJSONFilename",
      render: renderInputField("goRulesJSONFilename"),
    },
    {
      dataIndex: "delete",
      width: "60px",
      render: (value: string, _: RuleInfo, index: number) => (
        <Button danger onClick={() => deleteRule(index)}>
          Delete
        </Button>
      ),
    },
    {
      dataIndex: "view",
      width: "60px",
      render: (_: string, { _id }: RuleInfo) => (
        <Link href={`/rule/${_id}`}>
          <Button>View</Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center">
        <Link href="/">
          <HomeOutlined />
        </Link>
        <h1>Admin</h1>
        {!isLoading && (
          <Button type="primary" danger onClick={saveAllRuleUpdates}>
            Save Changes
          </Button>
        )}
      </Flex>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table columns={columns} dataSource={rules.map((rule, key) => ({ key, ...rule }))} />
      )}
    </>
  );
}
