import React, { useState } from "react";
import { Modal, Button, Flex, App } from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { RuleInfo } from "@/app/types/ruleInfo";
import { updateRuleData } from "@/app/utils/api";
import { sendRuleForReview } from "@/app/utils/githubApi";
import NewReviewForm from "./NewReviewForm";
import SavePublishWarnings from "./SavePublishWarnings";
import styles from "./SavePublish.module.css";

interface SavePublishProps {
  ruleInfo: RuleInfo;
  ruleContent: { nodes: []; edges: [] };
  setHasSaved: () => void;
}

export default function SavePublish({ ruleInfo, ruleContent, setHasSaved }: SavePublishProps) {
  const { _id: ruleId, goRulesJSONFilename: filePath, reviewBranch } = ruleInfo;

  const { message } = App.useApp();
  const [openNewReviewModal, setOpenNewReviewModal] = useState(false);
  const [currReviewBranch, setCurrReviewBranch] = useState(reviewBranch);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToReview, setIsSendingToReview] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateRuleData(ruleId, { ruleDraft: { content: ruleContent } });
      message.success("Draft saved");
    } catch (e) {
      message.error("Failed to save draft");
    }
    setIsSaving(false);
    setHasSaved();
  };

  const createOrUpdateReview = async (newReviewBranch?: string, reviewDescription: string = "") => {
    setIsSaving(true);
    setIsSendingToReview(true);
    // Save before sending to review
    await updateRuleData(ruleId, { ruleDraft: { content: ruleContent, reviewBranch: "test" } });
    // Prompt for new review branch details if they don't exist
    const branch = currReviewBranch || newReviewBranch;
    if (!branch) {
      setOpenNewReviewModal(true);
      return;
    }
    setOpenNewReviewModal(false);
    try {
      await sendRuleForReview(ruleContent, branch, filePath, reviewDescription);
      await updateRuleData(ruleId, { reviewBranch: branch });
      if (newReviewBranch) {
        setCurrReviewBranch(newReviewBranch);
      }
      message.success("Review updated/created");
    } catch (e) {
      console.error("Unable to update/create review");
      message.error("Unable to update/create review");
    }

    setIsSaving(false);
    setIsSendingToReview(false);
    setHasSaved();
  };

  const createNewReview = ({
    newReviewBranch,
    reviewDescription,
  }: {
    newReviewBranch: string;
    reviewDescription: string;
  }) => {
    createOrUpdateReview(newReviewBranch, reviewDescription);
  };

  return (
    <>
      <Modal
        title="New Review"
        open={openNewReviewModal}
        centered
        footer={null}
        onCancel={() => setOpenNewReviewModal(false)}
      >
        <NewReviewForm filePath={filePath} createNewReview={createNewReview} />
      </Modal>
      <Flex gap="small" justify="end" className={styles.savePublishWrapper}>
        <Button type="primary" onClick={save} disabled={isSaving}>
          Save <SaveOutlined />
        </Button>
        <Button
          type="primary"
          onClick={() => createOrUpdateReview()}
          className={styles.sendForReviewBtn}
          disabled={isSendingToReview}
        >
          {" "}
          Send for Review <UploadOutlined />
        </Button>
      </Flex>
      <SavePublishWarnings filePath={filePath} ruleContent={ruleContent} isSaving={isSaving} />
    </>
  );
}
