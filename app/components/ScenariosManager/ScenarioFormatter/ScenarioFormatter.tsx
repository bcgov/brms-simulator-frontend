import { useState, useEffect } from "react";
import { Table, Button, Switch } from "antd";
import { Scenario } from "@/app/types/scenario";
import styles from "./ScenarioFormatter.module.css";
import { RuleMap } from "@/app/types/rulemap";
import InputStyler from "../../InputStyler/InputStyler";
import { parseSchemaTemplate } from "../../InputStyler/InputStyler";
import FieldStyler from "../../InputStyler/subcomponents/FieldStyler";
import ICMOptionGenerator from "../ICMIntegration/ICMOptionGenerator";

const COLUMNS = [
  {
    title: "Field",
    dataIndex: "field",
    key: "field",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
  },
];

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry", "rulemap"];

interface rawDataProps {
  rulemap?: boolean;
  [key: string]: any;
}

interface ScenarioFormatterProps {
  title: string;
  rawData: rawDataProps | any | null | undefined;
  setRawData?: (data: object) => void;
  scenarios?: Scenario[];
  rulemap: RuleMap;
}

export default function ScenarioFormatter({ title, rawData, setRawData, scenarios, rulemap }: ScenarioFormatterProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);
  const [useICMData, setUseICMData] = useState(title === "Inputs");

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  useEffect(() => {
    console.log("RAW DATA", rawData);

    if (rawData) {
      const editable = title === "Inputs" && rawData.rulemap === true;
      let updatedRawData = rawData;
      if (editable) {
        const ruleMapInputs = rulemap?.inputs.reduce((obj: Record<string, any>, item: any) => {
          obj[item.field] = null;
          return obj;
        }, {});
        updatedRawData = { ...ruleMapInputs, ...rawData };
      }

      // Get any ICM option selectors that are used by muliple sub-options below
      let icmSelectors: { field: JSX.Element; value: JSX.Element }[] = [];
      if (useICMData && title === "Inputs" && updatedRawData.hasOwnProperty("familyUnitSize")) {
        icmSelectors = [
          {
            field: FieldStyler("Case"),
            value: ICMOptionGenerator("familyList", (newRawData: any) => {
              console.log("NEW", newRawData);
              const { dependentsList } = newRawData;
              let newData: rawDataProps = { familyUnitSize: dependentsList?.length };
              if (dependentsList.length > 0) {
                const person1 = dependentsList[0];
                if (rawData.hasOwnProperty("person1age")) {
                  newData.person1age = person1.age;
                }
                if (rawData.hasOwnProperty("person1hasPPMBStatus")) {
                  newData.person1hasPPMBStatus = person1.hasPPMBStatus;
                }
                if (rawData.hasOwnProperty("person1HasPWDStatus")) {
                  newData.person1HasPWDStatus = person1.hasPWDStatus;
                }
                if (rawData.hasOwnProperty("person1Warrant")) {
                  newData.person1Warrant = person1.hasWarrant;
                }
              }
              if (dependentsList.length > 1) {
                const person2 = dependentsList[1];
                if (rawData.hasOwnProperty("person2age")) {
                  newData.person2age = person2.age;
                }
                if (rawData.hasOwnProperty("person2hasPPMBStatus")) {
                  newData.person2hasPPMBStatus = person2.hasPPMBStatus;
                }
                if (rawData.hasOwnProperty("person2HasPWDStatus")) {
                  newData.person2HasPWDStatus = person2.hasPWDStatus;
                }
                if (rawData.hasOwnProperty("person2Warrant")) {
                  newData.person2Warrant = person2.hasWarrant;
                }
              }
              if (setRawData) {
                setRawData({ ...rawData, ...newData });
              }
            }) || <span>ERROR: Invalid response from option generator</span>,
          },
        ];
      }

      // Generate the input/output field inputs for each field
      const propertyRuleMap = Object.values(rulemap || {}).flat();
      const newData = Object.entries(updatedRawData)
        .filter(([field]) => !PROPERTIES_TO_IGNORE.includes(field))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([field, value], index) => {
          const fieldData = {
            field: FieldStyler(
              propertyRuleMap?.find((item) => item.field === field)?.name ||
                parseSchemaTemplate(field)?.arrayName ||
                field,
              propertyRuleMap?.find((item) => item.field === field)?.description
            ),

            value:
              (useICMData &&
                ICMOptionGenerator(field, (newRawData) => setRawData && setRawData({ ...rawData, ...newRawData }))) ||
              InputStyler(
                value,
                field,
                editable,
                scenarios,
                updatedRawData,
                setRawData,
                rulemap?.inputs.find((item) => item.field === field)
              ),
            key: index,
          };

          return fieldData;
        });
      // Check if data.result is an array
      if (Array.isArray(rawData)) {
        throw new Error("Please update your rule and ensure that outputs are on one line.");
      }
      // Combine possible ICM selectors with raw data fields
      setDataSource([...icmSelectors, ...newData]);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, useICMData]);

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
        {title === "Inputs" && (
          <span>
            Use ICM Lab data: <Switch checked={useICMData} onChange={() => setUseICMData(!useICMData)} />
          </span>
        )}
      </h4>
      {showTable && (
        <Table columns={columns} showHeader={false} dataSource={dataSource} pagination={{ hideOnSinglePage: true }} />
      )}
    </div>
  );
}
