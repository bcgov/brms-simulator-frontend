"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Flex, Spin, Table, Input, Tag } from "antd";
import type { Breakpoint, TablePaginationConfig, TableColumnsType } from "antd";
import type { ColumnFilterItem, FilterValue, SorterResult } from "antd/es/table/interface";
import { EyeOutlined, EditOutlined, CheckCircleOutlined, DownSquareOutlined } from "@ant-design/icons";
import { RuleInfo } from "./types/ruleInfo";
import { getAllRuleData } from "./utils/api";
import styles from "./styles/home.module.css";

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
  searchTerm?: string;
}

export default function Home() {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ColumnFilterItem[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 15,
      total: 0,
    },
    filters: {},
    searchTerm: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAllRuleData({
        page: tableParams.pagination?.current || 1,
        pageSize: tableParams.pagination?.pageSize,
        sortField: tableParams.sortField,
        sortOrder: tableParams.sortOrder,
        filters: tableParams.filters,
        searchTerm: tableParams.searchTerm,
      });

      setRules(response.data);
      setCategories(response.categories);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: response.total,
        },
      });
    } catch (error) {
      console.error(`Error loading rules: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => {
      fetchData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(tableParams)]
  );

  const handleSearch = (value: string) => {
    setTableParams({
      ...tableParams,
      searchTerm: value,
      pagination: { ...tableParams.pagination, current: 1 },
    });
  };

  const formatFilePathTags = (filepath: string) => {
    const parts = filepath.split("/");
    return parts.map((part, index) => (
      <React.Fragment key={index}>{index < parts.length - 1 && <Tag color="blue">{part}</Tag>}</React.Fragment>
    ));
  };

  const columns: TableColumnsType<RuleInfo> = [
    {
      title: "Rule",
      dataIndex: "title",
      key: "title",
      sorter: true,
      render: (_, record) => {
        const ruleLink = `/rule/${record._id}`;
        const draftLink = `${ruleLink}?version=draft`;
        return (
          <b>
            <a href={record.isPublished ? ruleLink : draftLink} className={styles.mainLink}>
              {record.title || record.filepath}
            </a>
          </b>
        );
      },
    },
    {
      title: "Categories",
      dataIndex: "filepath",
      key: "filepath",
      filters: categories,
      filteredValue: tableParams.filters?.filepath || null,
      filterSearch: true,
      sorter: true,
      render: (_, record) => <span>{formatFilePathTags(record.filepath)}</span>,
    },
    {
      title: "Versions",
      key: "versions",
      responsive: ["md" as Breakpoint],
      render: (_, record) => {
        const ruleLink = `/rule/${record._id}`;
        const draftLink = `${ruleLink}?version=draft`;
        return (
          <Flex gap="small" justify="end">
            <Button
              href={draftLink}
              icon={<EditOutlined />}
              type="dashed"
              size="small"
              danger
              className={styles.draftBtn}
            >
              Draft
            </Button>
            {record.reviewBranch && (
              <Button
                href={`${ruleLink}?version=inReview`}
                icon={<EyeOutlined />}
                type="dashed"
                size="small"
                className={styles.inReviewBtn}
              >
                In Review
              </Button>
            )}
            {record.isPublished && (
              <>
                <Button
                  href={ruleLink}
                  icon={<CheckCircleOutlined />}
                  type="dashed"
                  size="small"
                  className={styles.publishedBtn}
                >
                  Published
                </Button>
                <Button
                  href={`${ruleLink}/embedded`}
                  icon={<DownSquareOutlined />}
                  type="dashed"
                  size="small"
                  className={styles.embeddedBtn}
                >
                  Embeddable
                </Button>
              </>
            )}
          </Flex>
        );
      },
    },
  ];

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RuleInfo> | SorterResult<RuleInfo>[]
  ) => {
    setTableParams((prevParams) => ({
      pagination,
      filters,
      searchTerm: prevParams.searchTerm,
      ...(!Array.isArray(sorter) && {
        sortField: sorter.field as string,
        sortOrder: sorter.order ? sorter.order : undefined,
      }),
    }));
  };

  const clearAll = () => {
    setTableParams({
      pagination: { current: 1, pageSize: 15, total: 0 },
      filters: {},
      searchTerm: "",
      sortField: "",
      sortOrder: undefined,
    });
  };

  return (
    <>
      <Flex justify="space-between" align="center" className={styles.headerWrapper}>
        <h1>SDPR Business Rules Management</h1>
        <Flex gap="small">
          <Link href="/rule/new">
            <Button type="primary">New rule +</Button>
          </Link>
          <Link href="/admin">
            <Button danger>Admin</Button>
          </Link>
        </Flex>
      </Flex>
      <Flex gap="small">
        <Input.Search placeholder="Search rules..." onSearch={handleSearch} style={{ marginBottom: 16 }} allowClear />
        <Button onClick={clearAll}>Reset Filters ↻</Button>
      </Flex>
      {loading ? (
        <Spin tip="Loading rules..." className="spinner">
          <div className="content" />
        </Spin>
      ) : (
        <Table
          columns={columns}
          dataSource={rules}
          pagination={tableParams.pagination}
          loading={loading}
          onChange={handleTableChange}
          rowKey="_id"
        />
      )}
    </>
  );
}
