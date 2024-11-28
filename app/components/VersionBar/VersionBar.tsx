"use client";
import { Flex, Radio } from "antd";
import { CheckCircleFilled, CheckCircleOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { getVersionColor } from "@/app/utils/utils";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { RuleInfo } from "@/app/types/ruleInfo";

interface VersionBarProps {
  ruleInfo: RuleInfo;
  version?: string;
}

export default function VersionBar({
  ruleInfo,
  version = process.env.NEXT_PUBLIC_IN_PRODUCTION ? RULE_VERSION.inProduction : RULE_VERSION.inDev,
}: VersionBarProps) {
  const versionColor = getVersionColor(version);

  const getButtonStyle = (buttonVersion: RULE_VERSION) => {
    const baseStyle = { fontSize: "14px" };
    return {
      ...baseStyle,
      ...(version === buttonVersion
        ? {
            backgroundColor: versionColor,
            color: "white",
            paddingTop: "2px",
            height: "44px",
          }
        : {}),
    };
  };

  const switchVersion = (versionToSwitchTo: RULE_VERSION) => {
    const url = new URL(window.location.href);
    url.searchParams.set("version", versionToSwitchTo);
    url.searchParams.set("_", new Date().getTime().toString());
    window.location.href = url.toString();
  };

  return (
    <Flex gap="small" justify="start" align="center">
      Version:
      <Radio.Group size="large" style={{}} onChange={(e) => switchVersion(e.target.value)}>
        <Radio.Button value={RULE_VERSION.draft} style={getButtonStyle(RULE_VERSION.draft)}>
          <EditOutlined /> In Draft
        </Radio.Button>
        {ruleInfo.reviewBranch && (
          <Radio.Button value={RULE_VERSION.inReview} style={getButtonStyle(RULE_VERSION.inReview)}>
            <EyeOutlined /> In Review
          </Radio.Button>
        )}
        {ruleInfo.isPublished && (
          <Radio.Button value={RULE_VERSION.inDev} style={getButtonStyle(RULE_VERSION.inDev)}>
            <CheckCircleOutlined /> In Dev
          </Radio.Button>
        )}
        {ruleInfo.isPublished && process.env.NEXT_PUBLIC_IN_PRODUCTION === "true" && (
          <Radio.Button value={RULE_VERSION.inProduction} style={getButtonStyle(RULE_VERSION.inProduction)}>
            <CheckCircleFilled /> In Production
          </Radio.Button>
        )}
      </Radio.Group>
    </Flex>
  );
}
