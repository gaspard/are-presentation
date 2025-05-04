import * as React from "react";
import { makeKernel, randomBelousov } from "../functional/belousov";
import { Experiment } from "./lib/Experiment";
import { gridExperiment } from "./lib/experiments";
import { s, settingsValues } from "./lib/settings";

const experiment = gridExperiment({
  view: {
    axes: false,
    scale: 1 / 60,
    scene: {
      position: { x: -0.9, y: -0.8 },
    },
  },
  p: 2, // RG
  m: 400,
  n: 400,
  settings: {
    dt: s.float("dt", "$s$", 0.1, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
    seed: s.seed("reset"),
    break: s.break(),
    Du: s.float("diff. u", "", 0.49, (v) => v >= 0),
    Dv: s.float("diff. v", "", 0.03, (v) => v >= 0),
    f: s.float("feed", "", 0.035, (v) => v >= 0),
    k: s.float("kill", "", 0.06, (v) => v >= 0),
  },
  type: "grid",
  init: (experiment) => {
    const c = randomBelousov(400, 400);
    return c;
  },
  make(settings, cellular) {
    const { dt, Du, Dv, f, k } = settingsValues(settings);

    const kernel = makeKernel({
      Du,
      Dv,
      f,
      k,
      dt,
    });

    cellular.kernel = kernel;

    function step(time: number) {
      cellular.step(time);
      return cellular.output.values;
    }

    return step;
  },
});

export const Belousov = () => <Experiment experiment={experiment} />;
