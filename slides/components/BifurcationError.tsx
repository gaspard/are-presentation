/*
import * as React from "react";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";
import { Line } from "react-chartjs-2";

export const PopulationVsJLive = () => {
  const [data, setData] = React.useState<{ j: number; x: number; y: number; z: number }[]>([]);
  const [j, setJ] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setJ(prevJ => {
        if (prevJ >= 1) {
          clearInterval(interval);
          return prevJ;
        }
        return prevJ + 0.01;
      });
    }, 100); // toutes les 100ms, on augmente j
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (j > 1) return;

    const ode: ODE = {
      dt: 0.02,
      speed: 3.0,
      steps: 4000,
      rungeKutta: true,
      dimension: 3,
      startValue: [10, 10, 10],
      deriv: (input: Vect, t: number, output: Vect, offset: number) => {
        const x = input[offset];
        const y = input[offset + 1];
        const z = input[offset + 2];
        output[offset] = 0.58 * x - 0.00647 * x * x - 0.02 * x * y - 0.01 * x * z;
        output[offset + 1] = -0.3 * y + 0.5 * 0.02 * x * y - 0.01 * y * z;
        output[offset + 2] = -0.3 * z + 0.5 * 0.01 * x * z + j * 0.01 * y * z;
      },
    };

    const stepper = makeStepper(ode);

    let finalState = [0, 0, 0];

    for (let i = 0; i < 5000; i++) {
      const state = stepper.step(i * ode.dt);
      if (i === 4999) {
        finalState = [...state];
      }
    }

    setData(prev => [
      ...prev,
      { j: parseFloat(j.toFixed(2)), x: finalState[0], y: finalState[1], z: finalState[2] }
    ]);

  }, [j]);

  return (
    <div>
      <h2>Populations en fonction de j (mode animation)</h2>
      <Line
        data={{
          labels: data.map((d) => d.j),
          datasets: [
            {
              label: "Proies (x)",
              data: data.map((d) => ({ x: d.j, y: d.x })),
              borderColor: "blue",
              backgroundColor: "blue",
              pointRadius: 2,
              showLine: true,
            },
            {
              label: "Prédateurs (y)",
              data: data.map((d) => ({ x: d.j, y: d.y })),
              borderColor: "red",
              backgroundColor: "red",
              pointRadius: 2,
              showLine: true,
            },
            {
              label: "Omnivores (z)",
              data: data.map((d) => ({ x: d.j, y: d.z })),
              borderColor: "green",
              backgroundColor: "green",
              pointRadius: 2,
              showLine: true,
            },
          ],
        }}
        options={{
          scales: {
            x: { title: { display: true, text: "j" } },
            y: { title: { display: true, text: "population" } },
          },
          animation: {
            duration: 0, // instantané
          },
          elements: {
            point: {
              radius: 2,
            }
          }
        }}
      />
      <p>j = {j.toFixed(2)}</p>
    </div>
  );
};

*/
