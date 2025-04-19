import { describe, test } from "vitest";
import { makeStepper, ODE, solve, Vect } from "./runge-kutta";

const spring: (
  k: number,
  m: number,
  dt?: number,
  steps?: number,
  rungeKutta?: boolean
) => ODE = (k, m, dt = 0.01, steps = 100, rungeKutta = true) => ({
  // Number of steps in the output (more steps => finer computations).
  steps,
  // Duration for the steps (in seconds)
  dt,

  // Runge-Kutta
  rungeKutta: rungeKutta,

  // Number of parameters in the equation (without t)
  // We need two dimensions for second order ode: one for
  // x and one for x'
  dimension: 2,
  // Must be an array of "dimension" numbers
  startValue: [1, 0],
  // Spring: a = - (k/m) x
  // dx = v * dt
  // dv = - (k/m) x dt
  deriv: (input: Vect, dt: number, output: Vect) => {
    // x_{n+1} / dt = x_{n} + v_{n}
    output[0] = input[1];
    // v_{n+1} / dt = v_{n} - (k/m) x_{n}
    output[1] = -(k / m) * input[0];
  },
});

const x2: (dt: number, steps: number, rungeKutta: boolean) => ODE = (
  dt,
  steps,
  rungeKutta
) => ({
  // Number of steps in the output (more steps => finer computations).
  steps,
  // Duration for the steps (in seconds)
  dt,

  // Runge-Kutta
  rungeKutta: rungeKutta,

  // Number of parameters in the equation (without t)
  // We need two dimensions for second order ode: one for
  // x and one for x'
  dimension: 2,
  // Must be an array of "dimension" numbers
  startValue: [0, 0],
  deriv: (input: Vect, t: number, output: Vect) => {
    // dx/dt = v
    output[0] = input[1];
    // dv/dt = 1
    output[1] = 1;
  },
});

describe("rungeKutta", () => {
  test("should compute one step", (t) => {
    const data = solve(x2(0.5, 2, false));
    t.expect([...data]).toEqual([
      // t = 0
      0, // x0
      0, // v0
      // t = 0.5
      0, // x1
      0.5, // v1
      // t = 1.0
      0.25, // x2
      1, // v2
    ]);
  });

  test("should compute one step with runge-kutta", (t) => {
    const data = solve(x2(1, 20, true));
    t.expect([data[40], data[41]].map((f) => f.toFixed(4))).toEqual([
      "200.0000",
      "20.0000",
    ]);
  });
});

describe("stepper", (t) => {
  test("should compute one step at a time with runge-kutta", (t) => {
    const s = makeStepper(x2(1, 20, true));
    t.expect([...s.last].map((f) => f.toFixed(4))).toEqual([
      "0.0000",
      "0.0000",
    ]);
    s.step(1);
    t.expect([...s.last].map((f) => f.toFixed(4))).toEqual([
      "0.5000",
      "1.0000",
    ]);
  });
});
