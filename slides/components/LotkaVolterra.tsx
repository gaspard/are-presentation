import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { Experiment } from "./lib/Experiment";
import { pointsExperiment } from "./lib/experiments";
import { s, settingsValues } from "./lib/settings";

const experiment = pointsExperiment({
  view: {
    scale: 1 / 60,
    scene: { position: { x: -0.9, y: -0.8 } },
  },
  settings: {
    n: s.uint("trace", "iter.", 810, (v) => v > 1),
    dt: s.float("dt", "$s$", 0.007, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
    seed: s.seed("reset"),
    break: s.break(),
    prey: s.float("proies", "qté", 10, (v) => v > 0),
    predator: s.float("préd.", "qté", 10, (v) => v > 0),
    break2: s.break(),
    alpha: s.float("$\\alpha$", "", 0.58, (v) => v > 0),
    beta: s.float("$\\beta$", "", 0.02, (v) => v > 0),
    gamma: s.float("$\\gamma$", "", 0.01, (v) => v > 0),
    delta: s.float("$\\delta$", "", 0.3, (v) => v > 0),
    break3: s.break(),
    rungeKutta: s.enum("Runge-Kutta", ["off", "on"], 1),
  },
  type: "points",
  make(settings) {
    const { n, dt, speed, rungeKutta, alpha, beta, gamma, delta } =
      settingsValues(settings);

    const ode: ODE = {
      dt,
      speed,
      steps: n,
      rungeKutta: rungeKutta === 1,

      // We need two dimensions for second order ode: one for x and one for v.
      // MUST BE 3 for THREE.js 3D position.
      dimension: 3,
      // Initial position 1, velocity 0, z = 0.
      startValue: [10, 10, 0],
      // Spring: a = - (k/m) x
      // dx = v * dt
      // dv = - (k/m) x dt
      deriv: (input: Vect, t: number, output: Vect, offset: number) => {
        const x = input[offset];
        const y = input[offset + 1];
        // dx / dt = alpha x - beta x y
        output[offset] = alpha * x - beta * x * y;
        // dy / dt = gamma x y - delta y
        output[offset + 1] = gamma * x * y - delta * y;
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

export const LotkaVolterra = () => <Experiment experiment={experiment} />;
