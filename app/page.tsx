"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Flex, Spin, Table } from "antd";
import type { Breakpoint } from "antd";
import { EyeOutlined, EditOutlined, CheckCircleOutlined, DownSquareOutlined } from "@ant-design/icons";
import { RuleInfo } from "./types/ruleInfo";
import { getAllRuleData } from "./utils/api";
import styles from "./styles/home.module.css";

export default function Home() {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const mappedRules = rules.map(({ _id, title, goRulesJSONFilename, reviewBranch, isPublished }) => {
    const ruleLink = `/rule/${_id}`;
    const draftLink = `${ruleLink}?version=draft`;
    return {
      key: _id,
      titleLink: (
        <b>
          <a href={isPublished ? ruleLink : draftLink} className={styles.mainLink}>
            {title || goRulesJSONFilename}
          </a>
        </b>
      ),
      versions: (
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
          {reviewBranch && (
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
          {isPublished && (
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
      ),
    };
  });

  const columns = [
    {
      dataIndex: "titleLink",
    },
    { dataIndex: "versions", responsive: ["md" as Breakpoint] },
  ];

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
      {isLoading ? (
        <Spin tip="Loading rules..." className="spinner">
          <div className="content" />
        </Spin>
      ) : (
        <Table columns={columns} dataSource={mappedRules} showHeader={false} pagination={{ pageSize: 15 }} />
      )}
    </>
  );
}
