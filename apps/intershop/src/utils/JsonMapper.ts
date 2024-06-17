import { Blueprint } from "../types/Blueprint";

export default function jsonMapper(blueprint: Blueprint, toMapJson: any) {
  const getObjectValue = (obj: any, path: string) => {
    const keys = path.split(".");
    let current = obj;

    if (keys.length && keys[0] === "") {
      keys.shift();
    }
    for (const key of keys) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  };

  const getFilteredValue = (
    arr: any,
    filter: string,
    furtherSearch: string
  ) => {
    const [key, value] = filter.split(":");
    const found = arr.find(
      (item: any) =>
        item[key] === value.trim() ||
        item[key] === (value.trim() === "true") ||
        item[key] === parseInt(value.trim(), 10)
    );
    return found
      ? furtherSearch !== ""
        ? getObjectValue(found, furtherSearch)
        : found
      : undefined;
  };

  const getMappedValue = (arr: any, mapKey: string) => {
    return arr.map((item: any) => item[mapKey]);
  };

  const result: any = {};

  for (const key in blueprint) {
    const path = blueprint[key];
    const filterStartIndex = path.indexOf("{");
    const filterEndIndex = path.indexOf("}");
    const mapStartIndex = path.indexOf("[");
    const mapEndIndex = path.indexOf("]");
    let value;

    if (filterStartIndex > -1 && filterEndIndex > -1) {
      const objPath = path.substring(0, filterStartIndex);
      const filter = path.substring(filterStartIndex + 1, filterEndIndex);
      const obj = getObjectValue(toMapJson, objPath);

      if (Array.isArray(obj)) {
        const remainderFilter = path.split("}");
        value = getFilteredValue(
          obj,
          filter,
          remainderFilter.length ? remainderFilter[1].trim() : ""
        );
      }
    } else if (mapStartIndex > -1 && mapEndIndex > -1) {
      const objPath = path.substring(0, mapStartIndex);
      const mapKey = path.substring(mapStartIndex + 1, mapEndIndex);
      const obj = getObjectValue(toMapJson, objPath);

      if (Array.isArray(obj)) {
        value = getMappedValue(obj, mapKey);
      }
    } else {
      value = getObjectValue(toMapJson, path);
    }

    result[key] = value;
  }

  return result;
}
