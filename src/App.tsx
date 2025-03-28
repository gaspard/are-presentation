import "./App.css";
import { Slide } from "./slide/Slide";
import { slides } from "./slides";

function App() {
  const path = Object.keys(slides)[0];
  return (
    <div className="">
      <div className="mb-8 text-predator-300">ARE - proie / predateur</div>
      <Slide slide={slides[path].default} />
    </div>
  );
}

export default App;
