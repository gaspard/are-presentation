import { Settings, UintSetting } from "./settings";

type GridSettings = Settings;

export interface GridExperiment<
  T extends GridSettings = GridSettings,
  K = any
> {
  type: "grid";
  // dimension of each cell
  p: number;
  // number of rows
  n: number;
  // number of columns
  m: number;
  scale: number;
  translate: { x: number; y: number };
  settings: T;
  init?: (experiment: GridExperiment<T>) => K;
  make: (settings: T, cache: K) => (time: number) => Float32Array;
}

export function gridExperiment<T extends GridExperiment>(experiment: T): T {
  return experiment;
}

type PointsSettings = Settings & { n: UintSetting };

export interface PointsExperiment<
  T extends PointsSettings = PointsSettings,
  K = any
> {
  type: "points";
  scale: number;
  translate: { x: number; y: number };
  settings: T;
  init?: (experiment: PointsExperiment<T>) => K;
  make: (settings: T, cache: K) => (time: number) => Float32Array;
}

export function pointsExperiment<T extends PointsExperiment>(experiment: T): T {
  return experiment;
}

export type ExperimentType = GridExperiment | PointsExperiment;

export function isGrid(e: ExperimentType): e is GridExperiment {
  return e.type === "grid";
}

export function isPoints(e: ExperimentType): e is PointsExperiment {
  return e.type === "points";
}
