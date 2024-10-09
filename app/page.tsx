"use client";
import { useState, useEffect, useMemo, Fragment } from "react";
import Link from "next/link";
import { Button, Flex, Spin, Table, Input, Tag } from "antd";
import type { Breakpoint, TablePaginationConfig, TableColumnsType } from "antd";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import { EyeOutlined, EditOutlined, CheckCircleOutlined, DownSquareOutlined } from "@ant-design/icons";
import { RuleInfo } from "./types/ruleInfo";
import { getAllRuleData } from "./utils/api";
import styles from "./styles/home.module.css";

export default function Home() {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
  });

  useEffect(() => {
    const getRules = async () => {
      try {
        const ruleData = await getAllRuleData();
        setRules(ruleData);
        setIsLoading(false);
      } catch (error) {
        console.error(`Error loading rules: ${error}`);
      }
    };
    getRules();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const formatFilePathTags = (filepath: string) => {
    const parts = filepath.split("/");
    return parts.map((part, index) => (
      <Fragment key={index}>{index < parts.length - 1 && <Tag color="blue">{part}</Tag>}</Fragment>
    ));
  };

  // Generate filters for filepaths based on the full filepath of each rule
  const getFilepathFilters = useMemo(() => {
    const directories = new Set<string>();

    rules.forEach((rule) => {
      const parts = rule.filepath.split("/");
      let currentPath = "";

      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          currentPath += (currentPath ? "/" : "") + part;
          directories.add(currentPath);
        }
      });
    });

    return Array.from(directories).map((path) => ({
      text: path.split("/").pop() || "",
      value: path,
    }));
  }, [rules]);

  // Filter rules based on search terms and filepath filters
  const filteredRules = useMemo(() => {
    let result = rules;
    if (searchTerm) {
      result = result.filter(
        (rule) =>
          rule?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.filepath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filteredInfo.filepath) {
      const filepathFilters = filteredInfo.filepath as string[];
      result = result.filter((rule) => filepathFilters.some((path) => rule.filepath.startsWith(path)));
    }

    return result;
  }, [rules, searchTerm, filteredInfo]);

  const columns: TableColumnsType<RuleInfo> = [
    {
      title: "Rule",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => (a.title || "").localeCompare(b.title || ""),
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
      filters: getFilepathFilters,
      filteredValue: filteredInfo.filepath || null,
      onFilter: (value, record) => record.filepath.startsWith(value as string),
      filterMode: "tree",
      filterSearch: true,
      sorter: (a, b) => a.filepath.localeCompare(b.filepath),
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
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RuleInfo> | SorterResult<RuleInfo>[]
  ) => {
    setPagination(newPagination);
    setFilteredInfo(filters);
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
      <Input.Search placeholder="Search rules..." onChange={handleSearch} style={{ marginBottom: 16 }} allowClear />
      {isLoading ? (
        <Spin tip="Loading rules..." className="spinner">
          <div className="content" />
        </Spin>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredRules}
          pagination={{
            ...pagination,
            total: filteredRules.length,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          rowKey="_id"
        />
      )}
    </>
  );
}
