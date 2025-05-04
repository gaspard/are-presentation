import { lazy, LazyExoticComponent } from "react";

const files = import.meta.glob<{ default: () => React.ReactNode }>(
  "../slides/*.mdx"
);
const paths = Object.keys(files);

export type Slide = {
  name: string;
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
