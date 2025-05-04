import { Suspense } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import { Slide } from "./slide/Slide";
import { slides } from "./slides";

function App() {
  // basename="/are-presentation">
  return (
    <Router>
      <Suspense
        fallback={<div className="text-predator-300 opacity-20 m-24">...</div>}
      >
        <Routes>
          {slides.map((slide) => (
            <Route
              key={slide.path}
              path={slide.path}
              element={<Slide slide={slide} />}
            />
          ))}
          <Route key="all" path="/all" element={<All />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function All() {
  return (
    <div className="slide bg-predator-50 p-8 flex flex-col">
      {slides.map(({ Component }) => (
        <Component />
      ))}
    </div>
  );
}

export default App;
