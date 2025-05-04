import { lazy, LazyExoticComponent } from "react";

const files = import.meta.glob<{ default: () => React.ReactNode }>(
  "../slides/*.mdx"
);
const paths = Object.keys(files);

export type Presenter = "Louis" | "Cléo" | "Hugo" | "Gaspard" | "All";
const presenterByGroup: Record<number, Presenter> = {
  [0]: "All",
  [1]: "Louis",
  [2]: "Gaspard",
  [3]: "Hugo",
  [4]: "Cléo",
  [5]: "Gaspard",
};

function presenterFromName(name: string): Presenter {
  const re = /^(\d)/.exec(name);
  if (re) {
    const group = parseInt(re[1]);
    return presenterByGroup[group] ?? "All";
  }
  return "All";
}

export type Slide = {
  name: string;
  presenter: Presenter;
  path: string;
  file: () => Promise<{
    default: () => React.ReactNode;
  }>;
  page: number;
  total: number;
  prev?: Slide;
  next?: Slide;
  Component: LazyExoticComponent<() => React.ReactNode>;
};

export const slides: Slide[] = paths.map((path, idx) => {
  const name = path.match(/\.\/slides\/(.*)\.mdx$/)![1];
  const Component = lazy(files[path]);
  return {
    name,
    page: idx + 1,
    presenter: presenterFromName(name),
    total: paths.length,
    file: files[path],
    path: name.startsWith("00") ? "/" : `/${name.toLowerCase()}`,
    Component,
  };
});

for (let i = 0; i < slides.length; ++i) {
  slides[i].prev = slides[i - 1];
  slides[i].next = slides[i + 1];
}
