import { observe, tilia } from "@tilia/react";
import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { PointsExperiment } from "./lib/PointsExperiment";
import { s, settingsValues, Values } from "./lib/settings";

const settings = tilia({
  steps: s.uint("trace", "iter.", 940, (v) => v > 1),
  dt: s.float("dt", "$s$", 0.006, (v) => v > 0),
  speed: s.float("vitesse", "facteur", 3.0, (v) => v > 0),
  seed: s.seed("reset", ""),
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
});

type Settings = typeof settings;

let stepper;

observe(settings, (s) => {
  stepper = makeStepper(prey(settingsValues(s)));
});

function step(time: number) {
  stepper.step(time);
  return stepper.data;
}

export const LotkaVolterra = () => (
  <PointsExperiment
    settings={settings}
    step={step}
    scale={1 / 60}
    translate={{ x: -0.9, y: -0.8 }}
  />
);

function prey(s: Values<Settings>): ODE {
  const { dt, steps, speed, rungeKutta, prey, predator } = s;
  const ode: ODE = {
    dt,
    steps,
    speed,
    rungeKutta: rungeKutta === 1,
    dimension: 3,
    startValue: [prey, predator, 0], // MUST BE 3 for THREE.js 3D position
    deriv: preyDeriv(s),
  };
  return ode;
}

function preyDeriv({ alpha, beta, gamma, delta }: Values<Settings>) {
  return (input: Vect, t: number, output: Vect) => {
    const [x, y] = input;
    // dx / dt = alpha x - beta x y
    output[0] = alpha * x - beta * x * y;
    // dy / dt = gamma x y - delta y
    output[1] = gamma * x * y - delta * y;
  };
}
