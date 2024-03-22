"use client";
import SimulationViewer from "./components/SimulationViewer";

// TODO: These will eventually com from somewhere else
const JSON_FILE = "wintersupplementalt.json"; // "guideservicedogsupplementalt.json";
const DOC_ID = "06c0f927-c7e6-4dc9-a139-63c97b9bcfcb"; // "a0c740f6-183a-4427-8dd2-fa4ba31ddac0";
const CHEFS_FORM_ID = "223c8f22-9e51-45ce-b90c-62dc30333e78";

export default function Home() {
  return (
    <>
      <h1>Winter Supplement</h1>
      <SimulationViewer jsonFile={JSON_FILE} docId={DOC_ID} chefsFormId={CHEFS_FORM_ID} />
    </>
  );
}
