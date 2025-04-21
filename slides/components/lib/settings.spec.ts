import { describe, test } from "vitest";
import { formatFloat, magnitude, s, scaler, settingsValues } from "./settings";

describe("magnitude", () => {
  const tests: [number, number][] = [
    [0.0, -4],
    [1.0, 1],
    [145.03, 3],
    [-1.0, 1],
    [10000.0, 5],
    [-999.0, 3],
    [-0.9, 0],
    [0.09, -1],
    [0.092, -1],
    [0.0925, -1],
    [0.000925, -3],
  ];
  for (const v of tests) {
    test(`should return ${v[1]} for ${v[0]}`, (t) => {
      t.expect(magnitude(v[0])).toEqual(v[1]);
    });
  }
});

describe("formatFloat", () => {
  const tests: [number, string][] = [
    [0.0, "0.00"],
    [1.0, "1.00"],
    [145.03, "145.03"],
    [-1.0, "-1.00"],
    [10000.0, "10000.00"],
    [-999.0, "-999.00"],
    [-0.9, "-0.900"],
    [-0.925, "-0.925"],
    [0.09, "0.0900"],
    [0.092, "0.0920"],
    [0.0925, "0.0925"],
    [0.000925, "0.000925"],
  ];
  for (const v of tests) {
    test(`should display ${v[0]} as ${v[1]}`, (t) => {
      t.expect(formatFloat(v[0])).toEqual(v[1]);
    });
  }
});

describe("settingValues", () => {
  const settings = {
    foo: s.float("some float", "s", 0.123),
    bar: s.enum("some float", ["on", "off"], 1),
  };
  test("should parse settings to raw values", (t) => {
    t.expect(settingsValues(settings)).toEqual({ foo: 0.123, bar: 1 });
  });
});

describe("scaler", () => {
  const tests: [number, number, number][] = [
    [0.0, 10, 0.0000001],
    [10.0, 10, 10.0000005],
    [10.0, 100, 10.025],
    [10.0, 200, 10.5],
    [10.0, 400, 16.4],
    [10.0, 800, 70.23529],
    [10.0, -800, -50.23529],
  ];
  for (const v of tests) {
    test(`should return ${v[2]} for ${v[0]} at distance ${v[1]}`, (t) => {
      t.expect(scaler(v[0], v[1])).toBeCloseTo(v[2], 5);
    });
  }
});
