import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

const randomX = d3.randomNormal(0, 1);
const randomY = d3.randomNormal(0, 1);

const allPoints = Array.from({ length: 1000 }, () => {
  const x = randomX();
  const y = randomY();
  return [x, y];
});

export function Slider() {
  const [numPoints, setSliderValue] = useState(500);
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
  }, [position, numPoints, width, height]);

  useEffect(() => {
    setPoints(allPoints.slice(0, numPoints));
  }, [numPoints]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const c = chart.current?.getBoundingClientRect();
      if (!c) return;
      setPosition({
        x: e.clientX - c.left - c.width / 2,
        y: e.clientY - c.top - c.height / 2,
      });
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  const handleSliderChange = (e) => {
    setSliderValue(Number(e.target.value));
  };

  const drawChart = () => {
    // return [x + (position.x - x) ** 2 / 10, y + (position.y - y) ** 2 / 10];
    const cpoints = points.map(([x, y]) => {
      const xp = (width * x) / 6;
      const yp = (height * y) / 6;
      const dx = position.x - xp;
      const dy = position.y - yp;

      const k = Math.sqrt(dx ** 2 + dy ** 2) / 100;
      if (k === 0) {
        return [width / 2 + xp, height / 2 + yp];
      }

      return [width / 2 + xp + dx / k, height / 2 + yp + dy / k];
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
      <input
        type="range"
        min="1"
        step={1}
        max={1000}
        value={numPoints}
        onChange={handleSliderChange}
      />
      <div ref={chart} id="chart" className="flex"></div>
    </div>
  );
}
