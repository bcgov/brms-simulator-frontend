import React from "react";
import { Button, Form, Input } from "antd";
import { generateBranchName, generateReviewMessage } from "@/app/utils/githubApi";

interface NewReviewFormProps {
  filePath: string;
  createNewReview: ({
    newReviewBranch,
    reviewDescription,
  }: {
    newReviewBranch: string;
    reviewDescription: string;
  }) => void;
}

export default function NewReviewForm({ filePath, createNewReview }: NewReviewFormProps) {
  return (
    <Form
      name="basic"
      initialValues={{
        remember: true,
        newReviewBranch: generateBranchName(filePath),
        reviewDescription: generateReviewMessage(false, filePath),
      }}
      onFinish={createNewReview}
      autoComplete="off"
    >
      <br />
      <Form.Item
        label="Branch name"
        name="newReviewBranch"
        rules={[
          {
            required: true,
            message:
              "Branch names can include letters, numbers, dashes (-), underscores (_), and dots (.), but they cannot begin with a dot or end with a slash (/)",
            pattern: /^(?!\.)[a-zA-Z0-9\-_./]+(?<!\/)$/,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Review description"
        name="reviewDescription"
        rules={[{ required: true, message: "Please input a description for review" }]}
      >
        <Input.TextArea rows={5} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit for Review
        </Button>
      </Form.Item>
    </Form>
  );
}
