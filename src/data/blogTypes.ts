export type BlogLanguage = "zh" | "en";

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "equation"; text: string }
  | { type: "references"; items: string[] }
  | { type: "slides"; basePath: string; count: number }
  | {
      type: "image";
      src: string;
      alt: string;
      caption: string;
      width: number;
      height: number;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      caption: string;
      highlightedRow?: number;
    };

export type BlogPostMetadata = {
  slug: string;
  date: string;
  readTime: string;
  title: Record<BlogLanguage, string>;
  dek: Record<BlogLanguage, string>;
};

export type BlogPost = BlogPostMetadata & {
  content: Record<BlogLanguage, BlogBlock[]>;
};
