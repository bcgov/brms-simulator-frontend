import { Tooltip, Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export default function FieldStyler(fieldName: string, description?: string) {
  const popOverInformation = (
    <Popover placement="top" content={description} title={fieldName} trigger={"click"}>
      <span>
        {" "}
        <InfoCircleOutlined />
      </span>
    </Popover>
  );
  const helpDialog = "View Description";
  return (
    <label>
      {fieldName}
      {description && (
        <Tooltip title={helpDialog} placement="top">
          {popOverInformation}
        </Tooltip>
      )}
    </label>
  );
}
