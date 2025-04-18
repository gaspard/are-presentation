import { describe, test } from "vitest";
import { ODE, solve, stepper, Vect } from "./runge-kutta";

const spring: (
  k: number,
  m: number,
  duration?: number,
  steps?: number,
  rungeKutta?: boolean
) => ODE = (k, m, duration = 1, steps = 100, rungeKutta = true) => ({
  // Number of steps in the output (more steps => finer computations).
  steps,
  // Duration for the steps (in seconds)
  duration,

  // Runge-Kutta
  rungeKutta: rungeKutta,

  // Number of parameters in the equation (without t)
  // We need two dimensions for second order ode: one for
  // x and one for x'
  dimension: 2,
  // Must be an array of "dimension" numbers
  startValue: [x0, v0],
  // Spring: a = - (k/m) x
  // dx = v * dt
  // dv = - (k/m) x dt
  step: (input: Vect, dt: number, output: Vect) => {
    // x_{n+1} = x_{n} + v_{n} dt
    output[0] = input[1] * dt;
    // v_{n+1} = v_{n} - (k/m) x_{n} dt
    output[1] = -(k / m) * input[0] * dt;
  },
});

const x2: (duration: number, steps: number, rungeKutta: boolean) => ODE = (
  duration,
  steps,
  rungeKutta
) => ({
  // Number of steps in the output (more steps => finer computations).
  steps,
  // Duration for the steps (in seconds)
  duration,

  // Runge-Kutta
  rungeKutta: rungeKutta,

  // Number of parameters in the equation (without t)
  // We need two dimensions for second order ode: one for
  // x and one for x'
  dimension: 2,
  // Must be an array of "dimension" numbers
  startValue: [0, 0],
  step: (input: Vect, dt: number, output: Vect) => {
    // dx = v dt
    output[0] = input[1] * dt;
    // dv = dt
    output[1] = dt;
  },
});

describe("rungeKutta", () => {
  test("should compute one step", (t) => {
    const data = solve(x2(1, 2, false));
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
      "0.5000",
      "1.0000",
    ]);
  });
});

describe("stepper", (t) => {
  test("should compute one step at a time with runge-kutta", (t) => {
    const s = stepper(x2(1, 20, true));
    t.expect([...s.last].map((f) => f.toFixed(4))).toEqual([
      "0.0000",
      "0.0000",
    ]);
    s.next();
    t.expect([...s.last].map((f) => f.toFixed(4))).toEqual([
      "0.0012",
      "0.0500",
    ]);
  });
});
