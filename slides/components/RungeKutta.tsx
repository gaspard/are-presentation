import { observe, tilia } from "@tilia/react";
import * as d3 from "d3";
import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { PointsExperiment } from "./lib/PointsExperiment";
import { s, settingsValues } from "./lib/settings";

const settings = tilia({
  steps: s.uint("trace", "iter.", 6000, (v) => v > 1),
  dt: s.float("dt", "$s$", 0.01, (v) => v > 0),
  speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
  seed: s.seed("reset", ""),
  break: s.break(),
  k: s.float("k", "$kg/s^2$", 0.01, (v) => v > 0),
  m: s.float("m", "$kg$", 0.01, (v) => v > 0),
  break2: s.break(),
  rungeKutta: s.enum("Runge-Kutta", ["off", "on"]),
});

let stepper = makeStepper(spring(settings));

observe(settings, (s) => {
  stepper = makeStepper(spring(s));
});

function step(time: number) {
  stepper.step(time);
  return stepper.data;
}

export const RungeKutta = () => (
  <PointsExperiment settings={settings} step={step} scale={1 / 2} />
);

function spring(s: typeof settings): ODE {
  const { k, m, steps, dt, speed, rungeKutta } = settingsValues(s);

  const ode: ODE = {
    // Number of steps in the output (more steps => finer computations).
    dt,
    speed,
    // Duration for the steps (in seconds)
    steps,

    // Runge-Kutta
    rungeKutta: rungeKutta === 1,

    // Number of parameters in the equation (without t)
    // We need two dimensions for second order ode: one for
    // x and one for x'
    dimension: 3,
    // Must be an array of "dimension" numbers
    startValue: [1, 0, 0], // MUST BE 3 for THREE.js 3D position
    // Spring: a = - (k/m) x
    // dx = v * dt
    // dv = - (k/m) x dt
    deriv: (input: Vect, t: number, output: Vect, offset: number) => {
      const x = input[offset];
      const v = input[offset + 1];
      // dx_{n+1} / dt = v_{n}
      output[0] = v;
      // dv_{n+1} / dt = - (k/m) x_{n}
      output[1] = -(k / m) * x;
    },
  };
  return ode;
}
