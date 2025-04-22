import { observe, tilia, useTilia } from "@tilia/react";
import React, { useEffect, useMemo, useRef } from "react";
import { addGrid, addPoints, orthographicScene } from "./3D";
import { SettingsView } from "./SettingsView";
import {
  ExperimentType,
  GridExperiment,
  PointsExperiment,
} from "./experiments";
import { Settings } from "./settings";

export function Experiment({
  experiment,
}: {
  experiment: ExperimentType;
  scale?: number;
  translate?: { x: number; y: number };
}) {
  const { settings, update } = useExperiment(experiment);
  const seed = useTilia(settings).seed ?? { value: 0 };
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    switch (experiment.type) {
      case "grid":
        return gridExperiment(experiment, update, domElem.current);
      case "points":
        return pointsExperiment(experiment, update, domElem.current);
    }
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

function useExperiment(experiment: ExperimentType) {
  const exp = useMemo(() => {
    const settings = tilia(experiment.settings);
    const update = {} as { step: (time: number) => Float32Array };
    const cache = experiment.init
      ? experiment.init(experiment as any)
      : undefined;
    const make = experiment.make as (
      s: Settings,
      c: any
    ) => (time: number) => Float32Array;
    observe(settings, (s) => {
      update.step = make(s, cache);
    });

    return { settings, update };
  }, [experiment.settings, experiment.settings["seed"]?.value]);
  return exp;
}

function gridExperiment(
  experiment: GridExperiment,
  update: { step: (time: number) => Float32Array },
  element: HTMLDivElement
) {
  const scene = orthographicScene(element, experiment.translate, false);
  const gridUpdate = addGrid(scene.scene, experiment);
  scene.start((time) => {
    const data = update.step(time);
    gridUpdate(time, data);
  });
  return () => {
    scene.cleanup();
  };
}

function pointsExperiment(
  experiment: PointsExperiment,
  update: { step: (time: number) => Float32Array },
  element: HTMLDivElement
) {
  const scene = orthographicScene(element, experiment.translate, true);
  const gridUpdate = addPoints(scene.scene, experiment);
  scene.start((time) => {
    const data = update.step(time);
    gridUpdate(time, data);
  });
  return () => {
    scene.cleanup();
  };
}
