"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Input, Button, Flex } from "antd";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { FilterValue } from "antd/es/table/interface";
import { HomeOutlined } from "@ant-design/icons";
import { RuleInfo, RuleInfoBasic } from "../types/ruleInfo";
import { getAllRuleData, postRuleData, updateRuleData, deleteRuleData } from "../utils/api";

enum ACTION_STATUS {
  NEW = "new",
  UPDATE = "update",
  DELETE = "delete",
}

const PAGE_SIZE = 15;

interface TableParams {
  pagination?: TablePaginationConfig;
  searchTerm?: string;
}

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRules, setInitialRules] = useState<RuleInfo[]>([]);
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 15,
      total: 0,
    },
    searchTerm: "",
  });

  const getOrRefreshRuleList = async () => {
    setIsLoading(true);
    try {
      const ruleData = await getAllRuleData({
        page: tableParams.pagination?.current || 1,
        pageSize: tableParams.pagination?.pageSize || 15,
        searchTerm: tableParams.searchTerm || "",
      });
      const existingRules = ruleData?.data || [];
      setInitialRules(existingRules);
      setRules(JSON.parse(JSON.stringify([...existingRules])));
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: ruleData?.total || 0,
        },
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(
    () => {
      getOrRefreshRuleList();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(tableParams)]
  );

  const updateRule = (e: React.ChangeEvent<HTMLInputElement>, index: number, property: keyof RuleInfoBasic) => {
    const newRules = [...rules];
    newRules[index][property] = e.target.value;
    setRules(newRules);
  };

  const deleteRule = async (index: number) => {
    const { current, pageSize } = tableParams?.pagination || {};
    const deletionIndex = ((current || 1) - 1) * (pageSize || PAGE_SIZE) + index;
    const newRules = [...rules.slice(0, deletionIndex), ...rules.slice(deletionIndex + 1, rules.length)];
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
          initialRule.filepath !== rule.filepath
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

  const renderInputField = (fieldName: keyof RuleInfoBasic) => {
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
      title: "Filepath",
      dataIndex: "filepath",
      render: renderInputField("filepath"),
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

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>) => {
    setTableParams((prevParams) => ({
      pagination,
      filters,
      searchTerm: prevParams.searchTerm,
    }));
  };
  const handleSearch = (value: string) => {
    setTableParams({
      ...tableParams,
      searchTerm: value,
      pagination: { ...tableParams.pagination, current: 1 },
    });
  };

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
      <Input.Search placeholder="Search rules..." onSearch={handleSearch} style={{ marginBottom: 16 }} allowClear />

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table
          columns={columns}
          pagination={tableParams.pagination}
          onChange={handleTableChange}
          loading={isLoading}
          dataSource={rules.map((rule, key) => ({ key, ...rule }))}
        />
      )}
    </>
  );
}
