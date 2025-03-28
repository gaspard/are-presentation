export const slides: {
  [file_name: string]: { default: () => React.ReactNode };
} = import.meta.glob("../slides/*.mdx", { eager: true });
