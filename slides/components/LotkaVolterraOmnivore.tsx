import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { Experiment } from "./lib/Experiment";
import { pointsExperiment } from "./lib/experiments";
import { s, settingsValues } from "./lib/settings";

const experiment = pointsExperiment({
  scale: 1 / 30,
  translate: { x: -0.9, y: -0.8 },
  settings: {
    n: s.uint("trace", "iter.", 940, (v) => v > 1),
    dt: s.float("dt", "$s$", 0.02, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
    seed: s.seed("reset"),
    break: s.break(),
    prey: s.float("proies", "qté", 10, (v) => v > 0),
    predator: s.float("préd. int.", "qté", 10, (v) => v > 0),
    omnivore: s.float("omnivore", "qté", 10, (v) => v > 0),
    break2: s.break(),
    a: s.float("$a$", "croiss. proie", 0.58, (v) => v > 0),
    b: s.float("$b$", "compét. proie", 0.01, (v) => v >= 0),
    c: s.float("$c$", "cons. x→y", 0.02, (v) => v > 0),
    d: s.float("$d$", "cons. x→z", 0.01, (v) => v > 0),
    e: s.float("$e$", "mort. y", 0.3, (v) => v > 0),
    f: s.float("$f$", "rend. x→y", 0.5, (v) => v > 0),
    g: s.float("$g$", "cons. y→z", 0.01, (v) => v > 0),
    h: s.float("$h$", "mort. z", 0.3, (v) => v > 0),
    i: s.float("$i$", "rend. x→z", 0.5, (v) => v > 0),
    j: s.float("$j$", "rend. y→z", 0.5, (v) => v > 0),
    break3: s.break(),
    rungeKutta: s.enum("Runge-Kutta", ["off", "on"], 1),
  },
  type: "points",
  make(settings) {
    const {
      n,
      dt,
      speed,
      rungeKutta,
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      i,
      j,
      prey,
      predator,
      omnivore,
    } = settingsValues(settings);

    const ode: ODE = {
      dt,
      speed,
      steps: n,
      rungeKutta: rungeKutta === 1,
      dimension: 3,
      startValue: [prey, predator, omnivore],
      deriv: (input: Vect, t: number, output: Vect, offset: number) => {
        const x = input[offset];
        const y = input[offset + 1];
        const z = input[offset + 2];
        // dx/dt
        output[offset] = a * x - b * x * x - c * x * y - d * x * z;
        // dy/dt
        output[offset + 1] = -e * y + f * c * x * y - g * y * z;
        // dz/dt
        output[offset + 2] = -h * z + i * d * x * z + j * g * y * z;
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

export const LotkaVolterraOmnivore = () => (
  <Experiment experiment={experiment} />
);
