export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  // If source is not an object, just return source or target
  if (typeof source !== "object" || source === null) return target;
  if (typeof target !== "object" || target === null) return target;

  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        // @ts-ignore
        result[key] = deepMerge(target[key], source[key]);
      } else {
        // @ts-ignore
        result[key] = source[key];
      }
    }
  }
  return result;
}
