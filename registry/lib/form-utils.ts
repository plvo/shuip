import z from 'zod';

/**
 * Get the changed fields between two objects
 * @param oldObject - The old object
 * @param newObject - The new object
 * @param options - Configuration options
 * @returns The changed fields
 * @example
 * getChangedFields({ a: 1 }, { a: 1 }) // { }
 * getChangedFields({ a: 1 }, { a: 2 }) // { a: 2 }
 * getChangedFields({ a: 1 }, { b: 1 }) // { a: undefined, b:1 }
 */

export function getChangedFields<T extends Record<string, unknown>>(
  oldObject: T | null | undefined,
  newObject: T | null | undefined,
): Partial<T> {
  const changedFields: Partial<T> = {};

  if (!oldObject && !newObject) {
    return changedFields;
  }

  if (!oldObject) {
    return newObject ? { ...newObject } : changedFields;
  }

  if (!newObject) {
    const result: Partial<T> = {};
    Object.keys(oldObject).forEach((key) => {
      result[key as keyof T] = undefined as T[keyof T];
    });
    return result;
  }

  const allKeys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);

  allKeys.forEach((key) => {
    const typedKey = key as keyof T;
    const oldValue = oldObject[typedKey];
    const newValue = newObject[typedKey];

    if (!isDeepEqual(oldValue, newValue)) {
      changedFields[typedKey] = newValue;
    }
  });

  return changedFields;
}

/**
 * Deep equality comparison helper function
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns True if the values are deeply equal, false otherwise
 * @example
 * isDeepEqual(1, 1) // true
 * isDeepEqual(1, '1') // false
 * isDeepEqual({ a: 1 }, { a: 1 }) // true
 * isDeepEqual({ a: 1 }, { a: 2 }) // false
 * isDeepEqual([1, 2, 3], [1, 2, 3]) // true
 * isDeepEqual([1, 2, 3], [1, 2, 4]) // false
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isDeepEqual(item, b[index]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => bKeys.includes(key) && isDeepEqual(aObj[key], bObj[key]));
}

/**
 * Get the default values for a zod schema
 * @param schema - The zod schema
 * @param data - The data to use to get the default values
 * @returns The default values
 * @example
 * // Basic usage
 * getZodDefaultValues(z.object({ name: z.string() })) // { name: '' }
 *
 * // With nested objects
 * getZodDefaultValues(z.object({
 *   user: z.object({
 *     name: z.string(),
 *     age: z.number()
 *   })
 * })) // { user: { name: '', age: 0 } }
 *
 * // With provided data
 * getZodDefaultValues(
 *   z.object({ name: z.string(), age: z.number() }),
 *   { name: 'John' }
 * ) // { name: 'John', age: 0 }
 *
 */
export function getZodDefaultValues<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  data?: Partial<z.infer<T>>,
): z.infer<T> {
  return Object.keys(schema.shape).reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = data && data[key] !== undefined ? data[key] : zodTypeDefaultValue(schema.shape[key]);
    return acc;
  }, {});
}

/**
 * Get the default value for a zod type
 * @param key - The zod type
 * @returns The default value
 * @example
 * zodTypeDefaultValue(z.string()) // ''
 * zodTypeDefaultValue(z.number()) // 0
 * zodTypeDefaultValue(z.boolean()) // false
 * zodTypeDefaultValue(z.date()) // ''
 * zodTypeDefaultValue(z.array(z.string())) // []
 * zodTypeDefaultValue(z.object({ name: z.string() })) // { name: '' }
 */
export function zodTypeDefaultValue(key: z.ZodTypeAny): unknown {
  switch (key.constructor) {
    case z.ZodString:
      return '';
    case z.ZodNumber:
      return 0;
    case z.ZodBoolean:
      return false;
    case z.ZodDate:
      return undefined;
    case z.ZodArray:
      return [];
    case z.ZodObject: {
      const objectSchema = key as z.ZodObject<z.ZodRawShape>;
      return Object.keys(objectSchema.shape).reduce<Record<string, unknown>>((acc, fieldKey) => {
        acc[fieldKey] = zodTypeDefaultValue(objectSchema.shape[fieldKey]);
        return acc;
      }, {});
    }
    case z.ZodEnum: {
      return undefined;
    }
    case z.ZodNativeEnum: {
      return undefined;
    }
    case z.ZodOptional:
      return undefined;
    case z.ZodNullable:
      return null;
    default:
      return undefined;
  }
}
