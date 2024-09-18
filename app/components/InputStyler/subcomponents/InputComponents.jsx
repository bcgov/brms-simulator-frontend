import dayjs from "dayjs";
import { Tag, Input, Radio, AutoComplete, InputNumber, Flex, Button, Tooltip, DatePicker, Select } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { dollarFormat, getFieldValidation } from "@/app/utils/utils";
import InputStyler from "../InputStyler";
import { parseSchemaTemplate, parsePropertyName } from "../InputStyler";

export const DefaultInput = ({ show, property, handleValueChange }) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Input onBlur={(e) => handleValueChange(e.target.value, property)} />
      <span className="label-text">{parsePropertyName(property)}</span>
    </label>
  );
};

export const ChildFieldInput = ({ item, each, index, property, handleInputChange, scenarios, rawData, value }) => (
  <div key={each.property}>
    {each.label}
    {InputStyler(
      item[each.name],
      `${property}[${index}].${each.name}`,
      true,
      scenarios,
      rawData,
      (newData) => {
        const updatedArray = [...value];
        updatedArray[index] = {
          ...updatedArray[index],
          [each.name]: newData[`${property}[${index}].${each.name}`],
        };
        handleInputChange(updatedArray, property);
      },
      each
    )}
  </div>
);

export const ObjectArrayInput = ({ show, value, property, ruleProperties, handleInputChange, scenarios, rawData }) => {
  if (!show) return null;

  const parsedSchema = parseSchemaTemplate(property);
  const parsedPropertyName = parsedSchema?.arrayName || property;

  const customName = parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1);
  const childFields = ruleProperties?.child_fields || [];
  const childFieldMap = childFields.reduce((acc, field) => {
    acc[field.name] = null;
    return acc;
  }, {});

  return (
    <div>
      <Button icon={<PlusCircleOutlined />} onClick={() => handleInputChange([...value, childFieldMap], property)}>
        Add
      </Button>
      <Button icon={<MinusCircleOutlined />} onClick={() => handleInputChange(value.slice(0, -1), property)}>
        Remove
      </Button>
      {value.map((item, index) => (
        <div key={`value-item-${index}`}>
          <h4>
            {customName} {index + 1}
          </h4>
          <label className="labelsmall">
            {childFields.map((each) => (
              <ChildFieldInput
                key={`child-field-${each.name ?? null}-${index}`}
                item={item}
                each={each}
                index={index}
                property={property}
                handleInputChange={handleInputChange}
                scenarios={scenarios}
                rawData={rawData}
                value={value}
              />
            ))}
          </label>
        </div>
      ))}
    </div>
  );
};

export const ObjectLengthDisplay = ({ show, value }) => {
  if (!show) return null;
  return <div>{Object.keys(value).length}</div>;
};

export const BooleanInput = ({ show, value, property, handleInputChange }) => {
  if (!show) return null;
  return (
    <Flex gap="small" align="center" vertical>
      <label className="labelsmall">
        <Flex gap="small" align="center">
          <Radio.Group
            onChange={(e) => handleInputChange(e.target.value, property)}
            value={value === true ? true : value === false ? false : undefined}
          >
            <Flex gap="small" align="center">
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Flex>
          </Radio.Group>
          <Tooltip title="Clear value">
            <Button
              type="dashed"
              icon={<MinusCircleOutlined />}
              size="small"
              shape="circle"
              onClick={() => handleInputChange(undefined, property)}
            />
          </Tooltip>
        </Flex>
        <span className="label-text">{parsePropertyName(property)}</span>
      </label>
    </Flex>
  );
};

export const SelectInput = ({ show, value, property, options, handleInputChange }) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap="small" align="center">
        <Select
          id={property}
          options={options}
          defaultValue={value}
          style={{ width: 200 }}
          onChange={(val) => handleInputChange(val, property)}
        />
      </Flex>
      <span className="label-text">{parsePropertyName(property)}</span>
    </label>
  );
};

export const DateInput = ({ show, value, property, maximum, minimum, handleInputChange, handleClear }) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap="small" align="center">
        <DatePicker
          allowClear={false}
          id={property}
          maxDate={maximum}
          minDate={minimum}
          defaultValue={value ? dayjs(value, "YYYY-MM-DD") : null}
          format="YYYY-MM-DD"
          onChange={(val) => {
            const formattedDate = val ? val.format("YYYY-MM-DD") : null;
            handleInputChange(formattedDate, property);
          }}
          style={{ width: 200 }}
        />
        <Tooltip title="Clear value">
          <Button
            type="dashed"
            icon={<MinusCircleOutlined />}
            size="small"
            shape="circle"
            onClick={() => handleClear(property)}
          />
        </Tooltip>
      </Flex>
      <span className="label-text">{parsePropertyName(property)}</span>
    </label>
  );
};

export const ReadOnlyArrayDisplay = ({ show, value, property, scenarios, rawData, setRawData, ruleProperties }) => {
  if (!show) return null;
  const customName = parsePropertyName(property);
  return (
    <div>
      {value.map((item, index) => (
        <div key={index}>
          <h4>
            {customName} {index + 1}
          </h4>
          {Object.entries(item).map(([key, val]) => (
            <div key={key}>
              <label className="labelsmall">
                {key}
                {InputStyler(val, key, false, scenarios, rawData, setRawData, ruleProperties)}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const ReadOnlyBooleanDisplay = ({ show, value }) => {
  if (!show) return null;
  return (
    <Radio.Group onChange={() => null} value={value}>
      <Radio value={true}>Yes</Radio>
      <Radio value={false}>No</Radio>
    </Radio.Group>
  );
};

export const ReadOnlyStringDisplay = ({ show, value }) => {
  if (!show) return null;
  return <Tag color="blue">{value}</Tag>;
};

export const ReadOnlyNumberDisplay = ({ show, value, property }) => {
  if (!show) return null;
  if (property.toLowerCase().includes("amount")) {
    const formattedValue = dollarFormat(value);
    return <Tag color="green">${formattedValue}</Tag>;
  }
  return <Tag color="blue">{value}</Tag>;
};
