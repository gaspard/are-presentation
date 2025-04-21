export type BooleanSetting = {
  type: "boolean";
  name: string;
  value: boolean;
};

export type NumberSetting = {
  type: "boolean";
  name: string;
  value: number;
};

export type Setting = NumberSetting | BooleanSetting;

export type Settings = Record<string, Setting>;
