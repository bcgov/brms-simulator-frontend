"use client";
import { useState, useEffect } from "react";
import { logError } from "@/app/utils/logger";
import { CategoryObject } from "@/app/types/ruleInfo";
import { getAllRuleData, getBRERules } from "@/app/utils/api";
import { RuleMapRule } from "@/app/types/rulemap";
import RuleRelationsGraph from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay";

export default function Map({ params: { category } }: { params: { category: string } }) {
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

      const mappedKlammRules = klammRuleData.map((klammRule) => {
        const matchingRule = maxRuleData.data.find((rule) => rule.name === klammRule.name);
        return {
          ...klammRule,
          url: matchingRule ? `${matchingRule._id}` : undefined,
          filepath: matchingRule ? matchingRule.filepath : undefined,
        };
      });

      const getAllAncestors = (rule: any, allRules: any[], collected = new Set<string>()) => {
        rule.parent_rules?.forEach((parent: RuleMapRule) => {
          if (parent.name && !collected.has(parent.name)) {
            collected.add(parent.name);
            const parentRule = allRules.find((r) => r.name === parent.name);
            if (parentRule) {
              getAllAncestors(parentRule, allRules, collected);
            }
          }
        });
        return collected;
      };

      const getAllDescendants = (rule: any, allRules: any[], collected = new Set<string>()) => {
        rule.child_rules?.forEach((child: RuleMapRule) => {
          if (child.name && !collected.has(child.name)) {
            collected.add(child.name);
            const childRule = allRules.find((r) => r.name === child.name);
            if (childRule) {
              getAllDescendants(childRule, allRules, collected);
            }
          }
        });
        return collected;
      };

      // Filter mapped rules by category
      const decodedCategory = decodeURIComponent(category);
      const categoryRules = mappedKlammRules.filter((rule) =>
        rule.filepath?.toLowerCase().includes(decodedCategory.toLowerCase())
      );

      const relatedRuleNames = new Set<string>();
      categoryRules.forEach((rule) => {
        const ancestors = getAllAncestors(rule, mappedKlammRules);
        ancestors.forEach((name) => relatedRuleNames.add(name));
        const descendants = getAllDescendants(rule, mappedKlammRules);
        descendants.forEach((name) => relatedRuleNames.add(name));
      });

      const finalFilteredRules = mappedKlammRules.filter(
        (rule) => categoryRules.includes(rule) || relatedRuleNames.has(rule.name)
      );

      setKlammRules(finalFilteredRules || []);
      setCategories(maxRuleData?.categories || []);
    } catch (error: any) {
      logError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(
    () => {
      getOrRefreshRuleList();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <RuleRelationsGraph rules={klammRules} categories={categories} filter={decodeURIComponent(category)} />
      )}
    </>
  );
}
