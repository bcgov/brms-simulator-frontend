import { useState, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import { Select, Spin } from "antd";

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface ICMSearchSelectProps<ValueType = any> {
  name: string;
  fetchOptions: (search: string) => Promise<ValueType[]>;
  onSelect: (option: { value: string; label: string }) => void;
  debounceTimeout?: number;
}

export default function ICMSearchSelect<
  ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any
>({ name, fetchOptions, onSelect, debounceTimeout = 800 }: ICMSearchSelectProps) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        console.log(newOptions);
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  useEffect(() => {
    debounceFetcher("");
  }, []);

  return (
    <Select
      labelInValue
      filterOption={false}
      showSearch
      placeholder={name}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      options={options}
      onSelect={onSelect}
      style={{ minWidth: 200 }}
    />
  );
}
