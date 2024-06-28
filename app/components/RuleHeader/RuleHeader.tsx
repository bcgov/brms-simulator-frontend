"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Flex } from "antd";
import { HomeOutlined, EditOutlined, CheckOutlined } from "@ant-design/icons";
import { RuleInfo } from "@/app/types/ruleInfo";
import { updateRuleData } from "@/app/utils/api";
import styles from "./RuleHeader.module.css";

export default function RuleHeader({ ruleInfo }: { ruleInfo: RuleInfo }) {
  const { title, goRulesJSONFilename } = ruleInfo;

  const [savedTitle, setSavedTitle] = useState(title || goRulesJSONFilename);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currTitle, setCurrTitle] = useState(savedTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
    }
  }, [isEditingTitle]);

  const startEditingTitle = () => {
    setIsEditingTitle(true);
  };

  const updateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value !== currTitle) {
      setCurrTitle(e.target.value);
    }
  };

  const doneEditingTitle = async () => {
    setIsEditingTitle(false);
    const updatedRuleInfo = { ...ruleInfo, title: currTitle };
    try {
      await updateRuleData(ruleInfo._id, updatedRuleInfo);
      setSavedTitle(currTitle);
    } catch (e) {
      // If updating fails, revert to previous title name
      setCurrTitle(title || goRulesJSONFilename);
    }
  };

  return (
    <Flex gap="middle" align="center">
      <Link href="/">
        <HomeOutlined />
      </Link>
      <h1 onClick={startEditingTitle} style={{ width: isEditingTitle ? "100%" : "auto" }}>
        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            ref={inputRef}
            onBlur={doneEditingTitle}
            value={currTitle}
            onChange={updateTitle}
            aria-label="Edit title"
          />
        ) : (
          currTitle
        )}
      </h1>
      <button className={styles.editButton} onClick={isEditingTitle ? doneEditingTitle : startEditingTitle}>
        {isEditingTitle ? <CheckOutlined /> : <EditOutlined />}
      </button>
    </Flex>
  );
}
