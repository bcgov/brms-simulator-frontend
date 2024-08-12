"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button, Flex, Tag } from "antd";
import { HomeOutlined, EyeOutlined, EditOutlined, CheckOutlined } from "@ant-design/icons";
import { RuleInfo } from "@/app/types/ruleInfo";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { updateRuleData } from "@/app/utils/api";
import styles from "./RuleHeader.module.css";

export default function RuleHeader({
  ruleInfo,
  version = RULE_VERSION.published,
}: {
  ruleInfo: RuleInfo;
  version?: string;
}) {
  const pathname = usePathname();

  const [savedTitle, setSavedTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currTitle, setCurrTitle] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { title, goRulesJSONFilename } = ruleInfo;
    setSavedTitle(title || goRulesJSONFilename);
    setCurrTitle(title || goRulesJSONFilename);
  }, [ruleInfo]);

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
    try {
      await updateRuleData(ruleInfo._id, { title: currTitle });
      setSavedTitle(currTitle || "");
    } catch (e) {
      // If updating fails, revert to previous title name
      setCurrTitle(savedTitle);
    }
  };

  const switchVersion = (versionToSwitchTo: string) => {
    // Use window.locaiton.href instead of router.push so that we can detect page changes for "unsaved changes" popup
    window.location.href = `${pathname}?version=${versionToSwitchTo}&_=${new Date().getTime()}`;
  };

  const formatVersionText = (text: string) => {
    const words = text.split(/(?=[A-Z])/);
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  let versionColor = "green";
  if (version === RULE_VERSION.draft) {
    versionColor = "red";
  } else if (version === RULE_VERSION.inReview) {
    versionColor = "orange";
  }

  if (currTitle === undefined) return null;

  return (
    <div className={styles.headerContainer} style={{ background: versionColor }}>
      <Flex justify="space-between" className={styles.headerWrapper}>
        <Flex gap="middle" align="center" flex={isEditingTitle ? "1" : "none"} className={styles.headerContent}>
          <a href="/" className={styles.homeButton}>
            <HomeOutlined />
          </a>
          <Flex flex={1} vertical>
            <h1
              onClick={startEditingTitle}
              className={styles.titleHeader}
              style={{ width: isEditingTitle ? "100%" : "auto" }}
            >
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
            <p className={styles.titleFilePath}>{ruleInfo.goRulesJSONFilename}</p>
          </Flex>
          {isEditingTitle && (
            <button className={styles.editButton} onClick={isEditingTitle ? doneEditingTitle : startEditingTitle}>
              <CheckOutlined />
            </button>
          )}
          <Tag color={versionColor}>{formatVersionText(version)}</Tag>
        </Flex>
        <Flex gap="small" align="end">
          {ruleInfo.isPublished && version !== RULE_VERSION.published && (
            <Button onClick={() => switchVersion("published")} icon={<EyeOutlined />} type="dashed">
              Published
            </Button>
          )}
          {version !== RULE_VERSION.draft && (
            <Button onClick={() => switchVersion("draft")} icon={<EditOutlined />} type="dashed">
              Draft
            </Button>
          )}
          {ruleInfo.reviewBranch && version !== RULE_VERSION.inReview && (
            <Button onClick={() => switchVersion("inReview")} icon={<EyeOutlined />} type="dashed">
              In Review
            </Button>
          )}
        </Flex>
      </Flex>
    </div>
  );
}
