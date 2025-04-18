import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

const randomX = d3.randomNormal(0, 1);
const randomY = d3.randomNormal(0, 1);

const allPoints = Array.from({ length: 2000 }, () => {
  const x = randomX();
  const y = randomY();
  return [x, y];
});

export function Slider() {
  const [numPoints, setNumPoints] = useState(600);
  const [pow, setPow] = useState(0.55);
  const [mult, setMult] = useState(28);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState(allPoints.slice(0, numPoints));
  const chart = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    if (!chart.current) return;
    const r = chart.current.getBoundingClientRect();

    setWidth(r.width);
    setHeight(r.height);
  }, [chart.current]);

  useEffect(() => {
    drawChart();
  }, [position, numPoints, width, height, pow, mult]);

  useEffect(() => {
    setPoints(allPoints.slice(0, numPoints));
  }, [numPoints]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const c = chart.current?.getBoundingClientRect();
      if (!c) return;
      const x = e.clientX - c.left;
      const y = e.clientY - c.top;
      if (x < 0 || y < 0 || x > c.width || y > c.height) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition({
          x: x - c.width / 2,
          y: y - c.height / 2,
        });
      }
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  const handle = (setter: (v: number) => void) => (e) => {
    setter(Number(e.target.value));
  };

  const drawChart = () => {
    // return [x + (position.x - x) ** 2 / 10, y + (position.y - y) ** 2 / 10];
    const cpoints = points.map(([x, y]) => {
      const xp = (width * x) / 6;
      const yp = (height * y) / 6;
      const dx = position.x - xp;
      const dy = position.y - yp;

      const k1 = Math.sqrt(dx ** 2 + dy ** 2);
      if (k1 === 0) {
        return [width / 2 + xp, height / 2 + yp];
      }
      const k = mult / k1 ** pow;

      return [width / 2 + xp + dx * k, height / 2 + yp + dy * k];
    });
    const delaunay = d3.Delaunay.from(cpoints);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Clear previous SVG
    d3.select("#chart").select("svg").remove();

    // Create SVG
    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    svg
      .selectAll("path")
      .data(cpoints)
      .enter()
      .append("path")
      .attr("d", (d, i) => voronoi.renderCell(i))
      .attr("fill", "none")
      .attr("stroke", "#000");

    svg
      .selectAll("circle")
      .data(cpoints)
      .enter()
      .append("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("r", 3)
      .attr("fill", "black");
  };

  return (
    <div className="slider">
      <div className="grid grid-cols-2 gap-2">
        <div>nb points {numPoints}</div>
        <div>
          <input
            type="range"
            min="1"
            step={1}
            max={2000}
            value={numPoints}
            onChange={handle(setNumPoints)}
          />
        </div>
        <div>pow {pow.toFixed(2)}</div>
        <div>
          <input
            type="range"
            min={0}
            step={0.001}
            max={6}
            value={Math.exp(pow)}
            onChange={handle((v) => setPow(Math.log(v)))}
          />
        </div>
        <div>mult {mult.toFixed(1)}</div>
        <div>
          <input
            type="range"
            min={-100}
            step={0.1}
            max={100}
            value={mult}
            onChange={handle(setMult)}
          />
        </div>
      </div>
      <div ref={chart} id="chart" className="flex cursor-none"></div>
    </div>
  );
}
