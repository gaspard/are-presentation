import { useTilia } from "@tilia/react";
import * as React from "react";
import { Fragment, useState } from "react";
import { Katex } from "./Katex";
import {
  BreakSetting,
  formatFloat,
  hasUnits,
  isBoolean,
  isBreak,
  isFloat,
  isSeed,
  isUint,
  scaler,
  UintSetting,
  type EnumSetting,
  type FloatSetting,
  type SeedSetting,
  type Setting,
  type Settings,
} from "./settings";

export type Range = Record<string, number[]>;

export function SettingsView<T extends Object>(props: { settings: Settings }) {
  const settings = useTilia(props.settings);
  let group: string[] = [];
  const groups: string[][] = [group];
  for (const k in settings) {
    if (isBreak(settings[k])) {
      group = [k];
      groups.push(group);
    } else {
      group.push(k);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 h-full justify-between">
      {groups.map((g, i) => (
        <div key={i} className="col-span-3 grid grid-cols-subgrid">
          {g.map((k) =>
            hasUnits(settings[k]) ? (
              <Fragment key={k}>
                <Katex text={settings[k].name} />
                <Setting key={k} setting={settings[k]} />
                <Katex text={settings[k].units} />
              </Fragment>
            ) : (
              <Setting key={k} setting={settings[k]} />
            )
          )}
        </div>
      ))}
    </div>
  );
}

export function Setting({ setting }: { setting: Setting }) {
  if (isFloat(setting)) {
    return <Float setting={setting} />;
  }
  if (isUint(setting)) {
    return <Uint setting={setting} />;
  }
  if (isBoolean(setting)) {
    return <Enum setting={setting} />;
  }
  if (isSeed(setting)) {
    return <Seed setting={setting} />;
  }
  if (isBreak(setting)) {
    return <Break setting={setting} />;
  }
}

function Float({ setting }: { setting: FloatSetting }) {
  const s = useTilia(setting);
  const [dragging, setDragging] = useState(false);
  return (
    <span
      className={`value font-bold text-md cursor-move${
        dragging ? " text-pink-400" : ""
      }`}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragging) {
          setDragging(false);
          return;
        }
        setDragging(true);
        const current = s.value;
        let d = 0;

        (e.target as HTMLElement).requestPointerLock();

        function mouseMove(e: MouseEvent) {
          e.preventDefault();
          e.stopPropagation();

          d += e.movementX - e.movementY;
          const v = scaler(current, d);
          if (s.valid(v)) {
            s.value = v;
          }
        }
        function mouseUp() {
          setDragging(false);
          document.exitPointerLock();
          window.removeEventListener("mousemove", mouseMove);
          window.removeEventListener("mouseup", mouseUp);
        }
        window.addEventListener("mousemove", mouseMove);
        window.addEventListener("mouseup", mouseUp);
      }}
    >
      {formatFloat(s.value)}
    </span>
  );
}

function Uint({ setting }: { setting: UintSetting }) {
  const s = useTilia(setting);
  const [dragging, setDragging] = useState(false);
  return (
    <span
      className={`value font-bold text-md cursor-move${
        dragging ? " text-pink-400" : ""
      }`}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragging) {
          setDragging(false);
          return;
        }
        setDragging(true);
        const current = s.value;
        let d = 0;

        (e.target as HTMLElement).requestPointerLock();

        function mouseMove(e: MouseEvent) {
          e.preventDefault();
          e.stopPropagation();

          d += e.movementX - e.movementY;
          const v = scaler(current, d * 5);
          if (s.valid(v)) {
            s.value = Math.floor(v);
          }
        }
        function mouseUp() {
          setDragging(false);
          document.exitPointerLock();
          window.removeEventListener("mousemove", mouseMove);
          window.removeEventListener("mouseup", mouseUp);
        }
        window.addEventListener("mousemove", mouseMove);
        window.addEventListener("mouseup", mouseUp);
      }}
    >
      {s.value}
    </span>
  );
}

function Enum(props: { setting: EnumSetting }) {
  const s = useTilia(props.setting);
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    s.value = (s.value + 1) % s.enums.length;
  };

  return (
    <span
      className="col-span-3 grid grid-cols-subgrid"
      onMouseDown={onMouseDown}
    >
      <Katex text={s.name} className="cursor-pointer md:col-span-2" />
      <span className="value font-bold text-md cursor-pointer col-span-2 md:col-span-1">
        {s.enums[s.value] ?? ""}
      </span>
    </span>
  );
}

function Seed(props: { setting: SeedSetting }) {
  const s = useTilia(props.setting);
  return (
    <span
      className="value font-bold text-md cursor-pointer col-span-3"
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();

        s.value = Math.random();
      }}
    >
      {s.name}
    </span>
  );
}

function Break(props: { setting: BreakSetting }) {
  const s = useTilia(props.setting);
  return (
    <span className="value font-bold text-md cursor-pointer col-span-3">
      <Katex text={s.name} />
    </span>
  );
}
