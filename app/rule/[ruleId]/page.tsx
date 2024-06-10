import Link from "next/link";
import { Flex } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import SimulationViewer from "../../components/SimulationViewer";
import { getRuleDataById } from "../../utils/api";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const { title, _id, goRulesJSONFilename, chefsFormId } = await getRuleDataById(ruleId);

  if (!_id) {
    return <h1>Rule not found</h1>;
  }

  return (
    <>
      <Flex gap="middle" align="center">
        <Link href="/">
          <HomeOutlined />
        </Link>
        <h1>{title}</h1>
      </Flex>
      <SimulationViewer jsonFile={goRulesJSONFilename} chefsFormId={chefsFormId} />
    </>
  );
}
