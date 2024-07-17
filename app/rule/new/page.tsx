"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Input } from "antd";
import { RuleInfo } from "@/app/types/ruleInfo";
import RuleHeader from "@/app/components/RuleHeader";
import SimulationViewer from "../../components/SimulationViewer";

export default function Rule() {
  const [openNewRuleModal, setOpenNewRuleModal] = useState(false);
  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    _id: "", // TODO: These id will be updated for this once save functionality gets added
    title: "New rule",
    goRulesJSONFilename: "",
  });

  useEffect(() => {
    setOpenNewRuleModal(!ruleInfo.goRulesJSONFilename);
  }, [ruleInfo]);

  const createNewRule = (newRuleInfo: Partial<RuleInfo>) => {
    setRuleInfo({ ...ruleInfo, ...newRuleInfo });
  };

  return (
    <div>
      <Modal title="Create New Rule" open={openNewRuleModal} centered closable={false} footer={null}>
        <Form name="basic" initialValues={{ remember: true }} onFinish={createNewRule} autoComplete="off">
          <br />
          <Form.Item label="Rule title" name="title" rules={[{ required: true, message: "Please input your title!" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="File path/name"
            name="goRulesJSONFilename"
            rules={[{ required: true, message: "Please input your JSON file path!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <RuleHeader ruleInfo={ruleInfo} />
      <SimulationViewer ruleId={ruleInfo._id} jsonFile={ruleInfo.goRulesJSONFilename} editing isNewRule />
    </div>
  );
}
