import "./css/slide.css";
import "./css/typography.css";
import { type Slide } from "./slide_parser";

export function Slide({ slide: Comp }: { slide: () => React.ReactNode }) {
  return (
    <div className="slide bg-predator-50 rounded-2xl p-8 text-prey-800 text-left">
      <Comp />
    </div>
  );
}
