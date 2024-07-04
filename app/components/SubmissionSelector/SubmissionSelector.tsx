import { useState, useEffect } from "react";
import { AutoComplete, Input } from "antd";
import { getSubmissionsFromCHEFS, getSubmissionFromCHEFSById } from "../../utils/api";
import { Submission, SubmissionData } from "../../types/submission";
import styles from "./SubmissionSelector.module.css";

interface SubmissionSelectorProps {
  chefsFormId: string;
  setSelectedSubmissionInputs: (newSelection: SubmissionData) => void;
  resetTrigger: boolean;
}

export default function SubmissionSelector({
  chefsFormId,
  setSelectedSubmissionInputs,
  resetTrigger,
}: SubmissionSelectorProps) {
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const [valueToIdMap, setValueToIdMap] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");

  const onSelect = async (value: string) => {
    // Get selected submission input data from Chefs API
    const {
      submission: {
        submission: { data },
      },
    } = await getSubmissionFromCHEFSById(chefsFormId, valueToIdMap[value]);
    setSelectedSubmissionInputs(data);
    setSearchText(value);
  };

  // Extracted data transformation logic
  const transformSubmissions = (submissionsFromApi: Submission[]) => {
    const newOptions: { value: string }[] = [];
    const newValueToIdMap: Record<string, string> = {};
    submissionsFromApi.forEach(({ submissionId, createdBy, createdAt }: Submission) => {
      const option = `${createdBy} ${createdAt}`;
      newOptions.push({ value: option });
      newValueToIdMap[option] = submissionId;
    });
    return { newOptions, newValueToIdMap };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissionsFromApi = await getSubmissionsFromCHEFS(chefsFormId);
        const { newOptions, newValueToIdMap } = transformSubmissions(submissionsFromApi);
        setOptions(newOptions);
        setValueToIdMap(newValueToIdMap);
      } catch (error) {
        console.error("Error fetching JSON:", error);
      }
    };
    fetchData();
  }, [chefsFormId]);

  useEffect(() => {
    setSearchText("");
  }, [resetTrigger]);

  return (
    <AutoComplete
      options={options}
      onSelect={onSelect}
      onSearch={setSearchText}
      value={searchText}
      className={styles.selector}
      aria-label="Search for submissions"
    >
      <Input.Search size="large" placeholder="Search for submissions" />
    </AutoComplete>
  );
}
