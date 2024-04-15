import { Table, Button, Flex } from "antd";
import Link from "next/link";
import { RuleInfo } from "./types/ruleInfo";
import { getAllRuleData } from "./utils/api";

export default async function Home() {
  const rules: RuleInfo[] = await getAllRuleData();

  const mappedRules = rules.map(({ _id, title, chefsFormId }, key) => {
    return {
      key,
      titleLink: (
        <b>
          <a href={`/rule/${_id}`}>{title}</a>
        </b>
      ),
      editRule: (
        <a href={`https://sdpr.gorules.io/projects/${process.env.NEXT_PUBLIC_GO_RULES_PROJECT_ID}/documents/${_id}`}>
          Edit
        </a>
      ),
      submissionFormLink: <a href={`https://submit.digital.gov.bc.ca/app/form/submit?f=${chefsFormId}`}>Submission</a>,
    };
  });

  const columns = [
    {
      title: "Rule",
      dataIndex: "titleLink",
    },
    {
      title: "Edit Rule",
      dataIndex: "editRule",
    },
    {
      title: "Submission Form",
      dataIndex: "submissionFormLink",
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center">
        <h1>BRMS Rule Simulator</h1>
        <Link href="/admin">
          <Button>Admin</Button>
        </Link>
      </Flex>
      <Table columns={columns} dataSource={mappedRules} />
    </>
  );
}
