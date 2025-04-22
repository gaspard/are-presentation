export type EnumSetting = {
  type: "enum";
  name: string;
  enums: string[];
  value: number; // represents the index into enums
};

export type FloatSetting = {
  type: "float";
  name: string;
  units: string;
  value: number;
  valid: (v: number) => boolean;
};

export type UintSetting = {
  type: "uint";
  name: string;
  units: string;
  value: number;
  valid: (v: number) => boolean;
};

export type SeedSetting = {
  type: "seed";
  name: string;
  value: number;
};

export type BreakSetting = {
  type: "break";
  name: string;
  value: "break"; // just so that all settings have a value.
};

export type Setting =
  | FloatSetting
  | EnumSetting
  | SeedSetting
  | UintSetting
  | BreakSetting;

export type Settings<T extends object = {}> = Record<string, Setting> & T;

export function isBoolean(s: Setting): s is EnumSetting {
  return s.type === "enum";
}

export function isFloat(s: Setting): s is FloatSetting {
  return s.type === "float";
}

export function isUint(s: Setting): s is UintSetting {
  return s.type === "uint";
}

export function isSeed(s: Setting): s is SeedSetting {
  return s.type === "seed";
}

export function isBreak(s: Setting): s is BreakSetting {
  return s.type === "break";
}

export function hasUnits(s: Setting): s is Setting & { units: string } {
  return typeof (s as FloatSetting).units === "string";
}

const anyFloat = () => true;
const anyUint = (v: number) => v >= 0;

export const s = {
  enum(name: string, enums: string[], value: number = 0) {
    const v: EnumSetting = {
      enums,
      name,
      type: "enum",
      value,
    };
    return v;
  },
  break(name = "") {
    const v: BreakSetting = { type: "break", name, value: "break" };
    return v;
  },
  float(
    name: string,
    units: string,
    value: number,
    valid: (v: number) => boolean = anyFloat
  ) {
    const v: FloatSetting = {
      name,
      type: "float",
      units,
      valid,
      value,
    };
    return v;
  },
  seed(name: string, value: number = Math.random()) {
    const v: SeedSetting = {
      name,
      type: "seed",
      value,
    };
    return v;
  },
  uint(
    name: string,
    units: string,
    value: number,
    valid: (v: number) => boolean = anyUint
  ) {
    const v: UintSetting = {
      name,
      type: "uint",
      units,
      valid,
      value: Math.abs(Math.floor(value)),
    };
    return v;
  },
};

type SettingValue<T> = T extends EnumSetting
  ? number
  : T extends FloatSetting
  ? number
  : T extends UintSetting
  ? number
  : T extends SeedSetting
  ? number
  : never;

export type Values<T extends Record<string, any>> = {
  [K in keyof T]: SettingValue<T[K]>;
};

export function settingsValues<T extends Record<string, any>>(s: T) {
  return Object.fromEntries(
    Object.entries(s).map(([key, value]) => [key, value.value])
  ) as Values<T>;
}

export function magnitude(v: number) {
  if (v === 0) return -4;
  return Math.floor(Math.log10(Math.abs(v)) + 1);
}

export function scaler(v: number, dist: number) {
  const m = v === 0 ? -3 : magnitude(v);
  const x = dist / 200;
  if (m > 0) {
    // return v + x ** 3;
  }
  return v + x ** 5 / (1 + x ** 2);
}

export function formatFloat(v: number): string {
  if (v === 0) return "0.00";
  const m = -magnitude(v);

  if (m >= 0) {
    return v.toFixed(m + 3);
  } else {
    return v.toFixed(2);
  }
}
