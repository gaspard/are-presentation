import { describe, test } from "vitest";
import { ODE, solve, Vect } from "./runge-kutta";

describe("rungeKutta", () => {
  const ode: (
    k: number,
    m: number,
    x0: number,
    v0: number,
    order?: number
  ) => ODE = (k, m, x0, v0, order = 4) => ({
    // Number of steps in the output (more steps => finer computations).
    steps: 2,
    // Starting time value (defaults to 0)
    start: 0,
    // Time rangee length (defaults to 1)
    duration: 1,

    // Order of the Runge-Kutta (more => better simulation, defaults to 4)
    order,

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
      output[0] = input[0] + input[1] * dt;
      // v_{n+1} = v_{n} - (k/m) x_{n} dt
      output[1] = input[1] - (k / m) * input[0] * dt;
    },
  });

  test("should compute one step", (t) => {
    const data = solve(ode(1, 1, 1, 0, 0));
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
