interface MdComponentOptions {
  components?: Record<string, (props: any) => React.ReactNode>;
}

declare module "markdown-it-react-component" {
  function md_comp(md: MarkdownIt, options?: MdComponentOptions): void;
  export = md_comp;
}
