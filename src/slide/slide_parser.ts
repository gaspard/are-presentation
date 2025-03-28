import yaml from "yaml";

const matter_re = /^---\n([\s\S]*?)\n---(.*)$/;

export interface Slide {
  md: string;
}

export function slide_parser(text: string): Slide {
  const re = matter_re.exec(text);
  if (re) {
    try {
      const data: Slide = yaml.parse(re[1]);
      data.md = re[2];
      return data;
    } catch (e) {
      console.log(e);
      return { md: re[2] };
    }
  }
  return { md: text };
}
