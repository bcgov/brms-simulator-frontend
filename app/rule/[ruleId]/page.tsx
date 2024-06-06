import Link from "next/link";
import { Flex } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import SimulationViewer from "../../components/SimulationViewer";
import { getRuleDataById, getRuleMapByID } from "../../utils/api";
import { RuleMap } from "@/app/types/rulemap";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  const { title, _id, goRulesJSONFilename, chefsFormId } = await getRuleDataById(ruleId);
  const rulemap: RuleMap = await getRuleMapByID(ruleId);

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
      <SimulationViewer rulemap={rulemap} jsonFile={goRulesJSONFilename} docId={_id} chefsFormId={chefsFormId} />
    </>
  );
}
