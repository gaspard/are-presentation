import { describe, test } from "vitest";
import { ODE, solve, Vect } from "./runge-kutta";

describe("rungeKutta", () => {
  const k = 1,
    m = 0.01,
    x0 = 1,
    v0 = 0;
  const ode: (duration: number, steps: number, rungeKutta: boolean) => ODE = (
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

  test("should compute one step", (t) => {
    const data = solve(ode(0.1, 2, false));
    t.expect([...data]).toEqual([
      // t = 0
      1, // x0
      0, // v0
      // t = 0.5
      1, // x1
      -0.5, // v1
      // t = 1.0
      0.75, // x2
      -1, // v2
    ]);
  });

  test("should compute one step with runge-kutta", (t) => {
    const data = solve(ode(1, 20, true));
    t.expect([...data]).toEqual([
      // t = 0
      1, // x0
      0, // v0
      // t = 0.5
      1, // x1
      -0.5, // v1
      // t = 1.0
      0.75, // x2
      -1, // v2
    ]);
  });
});
