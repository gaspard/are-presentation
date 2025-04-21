import { useTilia } from "@tilia/react";
import React, { useEffect, useRef } from "react";
import { addPoints, orthographicScene } from "./3D";
import { SettingsView } from "./SettingsView";
import { Settings } from "./settings";

export function PointsExperiment({
  step,
  settings,
  scale = 1,
  translate = { x: 0, y: 0 },
}: {
  step: (time: number) => Float32Array;
  settings: Settings;
  scale?: number;
  translate?: { x: number; y: number };
}) {
  const seed = useTilia(settings).seed ?? { value: 0 };
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = orthographicScene(domElem.current, translate);
    const update = addPoints(scene.scene, scale);
    scene.start((time) => {
      const data = step(time);
      update(data);
    });
    return () => {
      scene.cleanup();
    };
  }, [seed.value]);

  return (
    <div className="flex flex-col md:flex-row w-full bg-research-900">
      <div ref={domElem} className="w-full md:w-2/3" />
      <div className="w-full md:w-1/3 p-4 bg-research-900 flex text-research-500 flex-col justify-between">
        <SettingsView settings={settings} />
      </div>
    </div>
  );
}
