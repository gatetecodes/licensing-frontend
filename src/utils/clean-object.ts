import { isNil, isEmpty, isObject } from "lodash";

/**
 * Recursively removes empty values from an object
 * @param obj - The object to clean
 * @returns Cleaned object with empty values removed
 */
export function cleanObject<T>(obj: T): T {
  if (isNil(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => cleanObject(item))
      .filter((item) => {
        if (isNil(item)) return false;
        if (typeof item === "string") return !isEmpty(item.trim());
        if (isObject(item) && !(item instanceof Date)) return !isEmpty(item);
        return true;
      });
    return cleanedArray as unknown as T;
  }

  if (!isObject(obj) || obj instanceof Date) {
    return obj;
  }

  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isNil(value)) {
      continue;
    }

    if (typeof value === "string") {
      if (!isEmpty(value.trim())) {
        cleaned[key as keyof T] = value.trim() as T[keyof T];
      }
      continue;
    }

    if (Array.isArray(value)) {
      const cleanedArray = value
        .map((item) => cleanObject(item))
        .filter((item) => {
          if (isNil(item)) return false;
          if (typeof item === "string") return !isEmpty(item.trim());
          if (isObject(item) && !(item instanceof Date)) return !isEmpty(item);
          return true;
        });
      if (cleanedArray.length > 0) {
        cleaned[key as keyof T] = cleanedArray as T[keyof T];
      }
      continue;
    }

    if (isObject(value)) {
      // Special handling for Date objects - they should be preserved
      if (value instanceof Date) {
        cleaned[key as keyof T] = value as T[keyof T];
        continue;
      }

      const cleanedValue = cleanObject(value as Record<string, unknown>);
      if (!isEmpty(cleanedValue)) {
        cleaned[key as keyof T] = cleanedValue as T[keyof T];
      }
      continue;
    }

    // For other types (number, boolean, Date, etc.)
    cleaned[key as keyof T] = value as T[keyof T];
  }

  return cleaned as T;
}
