import { useTilia } from "@tilia/react";
import * as React from "react";

export type Range = Record<string, number[]>;

export function Inputs<T extends Object>({
  branch,
  range,
}: {
  branch: T;
  range: Range;
}) {
  return (
    <div className="flex flex-col w-1/2">
      {typedKeys(branch).map((k) => (
        <Input key={k} branch={branch} entry={k} range={range} />
      ))}
    </div>
  );
}

export function Input<T>({
  branch,
  entry,
  range,
}: {
  branch: T;
  entry: keyof T;
  range: Range;
}) {
  const obj = useTilia(branch);
  const v = obj[entry];
  if (typeof v === "number") {
    const r = range[entry as any];
    return (
      <>
        <label>
          {String(entry)}: {v.toFixed(3)}
        </label>
        <input
          type="range"
          min={r[0]}
          max={r[1]}
          step={r[2]}
          value={v}
          onChange={(e) => {
            obj[entry] = Number(e.target.value) as any;
          }}
        />
      </>
    );
  } else if (typeof v === "boolean") {
    return (
      <>
        <label>{String(entry)}</label>
        <input
          type="checkbox"
          checked={v}
          onChange={() => {
            obj[entry] = !v as any;
          }}
        />
      </>
    );
  }
}

function typedKeys<T extends Object>(obj: T): Extract<keyof T, string>[] {
  return Object.keys(obj) as any;
}
