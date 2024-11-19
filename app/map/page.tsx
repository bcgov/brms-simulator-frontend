"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Flex } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { logError } from "@/app/utils/logger";
import { CategoryObject } from "../types/ruleInfo";
import { getAllRuleData, getBRERules } from "../utils/api";
import RuleRelationsGraph from "../components/RuleRelationsDisplay/RuleRelationsDisplay";

export default function Map() {
  const [isLoading, setIsLoading] = useState(true);
  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryObject[]>([]);

  const getOrRefreshRuleList = async () => {
    setIsLoading(true);
    try {
      const maxRuleData = await getAllRuleData({
        page: 1,
        pageSize: 5000,
        searchTerm: "",
      });
      const klammRuleData = await getBRERules();

      // Map Klamm rules with URLs from matching rules
      const mappedKlammRules = klammRuleData.map((klammRule) => {
        const matchingRule = maxRuleData.data.find((rule) => rule.name === klammRule.name);
        return {
          ...klammRule,
          url: matchingRule ? `${matchingRule._id}` : undefined,
          filepath: matchingRule ? matchingRule.filepath : undefined,
        };
      });

      setKlammRules(mappedKlammRules || []);
      setCategories(maxRuleData?.categories || []);
    } catch (error: any) {
      logError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrRefreshRuleList();
  }, []);

  return (
    <>
      <Flex justify="space-between" align="center">
        <Link href="/">
          <HomeOutlined />
        </Link>
        <h1>Rule Map</h1>
      </Flex>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <RuleRelationsGraph rules={klammRules} categories={categories} />
        </>
      )}
    </>
  );
}
