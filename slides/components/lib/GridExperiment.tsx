import { useTilia } from "@tilia/react";
import React, { useEffect, useRef } from "react";
import { addGrid, orthographicScene } from "./3D";
import { SettingsView } from "./SettingsView";
import { GridExperiment } from "./experiments";

export function GridExperiment({
  step,
  experiment,
}: {
  experiment: GridExperiment;
  step: (time: number) => Float32Array;
}) {
  const { settings } = experiment;
  const seed = useTilia(settings).seed ?? { value: 0 };
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = orthographicScene(domElem.current, experiment);
    const update = addGrid(scene.scene, experiment);
    scene.start((time) => {
      const data = step(time);
      update(time, data);
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
