import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { Experiment } from "./lib/Experiment";
import { pointsExperiment } from "./lib/experiments";
import { s, settingsValues } from "./lib/settings";

const experiment = pointsExperiment({
  scale: 1 / 2,
  settings: {
    n: s.uint("trace", "iter.", 6000, (v) => v > 1),
    dt: s.float("dt", "$s$", 0.01, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
    seed: s.seed("reset"),
    break: s.break(),
    k: s.float("k", "$kg/s^2$", 0.01, (v) => v > 0),
    m: s.float("m", "$kg$", 0.01, (v) => v > 0),
    break2: s.break(),
    rungeKutta: s.enum("Runge-Kutta", ["off", "on"]),
  },
  translate: { x: 0, y: 0 },
  type: "points",
  make(settings) {
    const { k, m, n, dt, speed, rungeKutta } = settingsValues(settings);

    const ode: ODE = {
      dt,
      speed,
      steps: n,
      rungeKutta: rungeKutta === 1,

      // We need two dimensions for second order ode: one for x and one for v.
      // MUST BE 3 for THREE.js 3D position.
      dimension: 3,
      // Initial position 1, velocity 0, z = 0.
      startValue: [1, 0, 0],
      // Spring: a = - (k/m) x
      // dx = v * dt
      // dv = - (k/m) x dt
      deriv: (input: Vect, t: number, output: Vect, offset: number) => {
        const x = input[offset];
        const v = input[offset + 1];
        // dx / dt = v
        output[offset] = v;
        // dv / dt = - (k/m) x
        output[offset + 1] = -(k / m) * x;
      },
    };

    const stepper = makeStepper(ode);

    function step(time: number) {
      stepper.step(time);
      return stepper.data;
    }

    return step;
  },
});

export const RungeKutta = () => <Experiment experiment={experiment} />;
