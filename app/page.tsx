"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Flex, Spin, Table } from "antd";
import { RuleInfo } from "./types/ruleInfo";
import { getAllRuleData } from "./utils/api";

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

  const mappedRules = rules.map(({ _id, title, goRulesJSONFilename }) => {
    return {
      key: _id,
      titleLink: (
        <b>
          <Link href={`/rule/${_id}`}>{title || goRulesJSONFilename}</Link>
        </b>
      ),
      downloadRule: (
        <a href={`/api/documents?ruleFileName=${encodeURIComponent(goRulesJSONFilename)}`}>Download JSON</a>
      ),
    };
  });

  const columns = [
    {
      title: "Rule",
      dataIndex: "titleLink",
    },
    {
      title: "Download Rule",
      dataIndex: "downloadRule",
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center">
        <h1>BRMS Rule Simulator</h1>
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
        <Spin tip="Loading rules...">
          <div className="content" />
        </Spin>
      ) : (
        <Table columns={columns} dataSource={mappedRules} />
      )}
    </>
  );
}
