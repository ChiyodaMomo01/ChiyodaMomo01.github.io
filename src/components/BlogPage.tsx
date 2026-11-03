import { ArrowUpRight } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { type Dispatch, type ReactNode, type SetStateAction, useMemo, useState } from "react";
import { blogPosts, type BlogBlock, type BlogLanguage } from "../data/blog";

export default function BlogPage({ slug }: { slug: string | null }) {
  const [language, setLanguage] = useState<BlogLanguage>("zh");
  const activePost = useMemo(() => {
    if (!slug) return null;
    return blogPosts.find((post) => post.slug === slug) ?? null;
  }, [slug]);

  if (slug && !activePost) {
    return (
      <section className="blog-shell">
        <h1>Article not found</h1>
        <p>This article is unavailable.</p>
        <a className="text-link" href="#blog">
          Back to blog <ArrowUpRight size={16} />
        </a>
      </section>
    );
  }

  if (activePost) {
    return (
      <BlogArticle
        post={activePost}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  return (
    <section className="blog-shell section-shell" lang={language === "zh" ? "zh-CN" : "en"}>
      <div className="blog-hero blog-hero-with-toggle">
        <div>
          <p className="eyebrow">Research Blog</p>
          <h1>{language === "zh" ? "关于 AI 与科学建模的研究笔记" : "Notes on AI and scientific modeling"}</h1>
          <p>
            {language === "zh"
              ? "记录论文阅读、实验与研究思考，以及那些值得继续追问的问题。"
              : "Longer-form notes on papers, experiments, research ideas, and the occasional question that refuses to stay small."}
          </p>
        </div>
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </div>
      <div className="blog-list">
        {blogPosts.map((post) => (
          <article className="blog-card" key={post.slug}>
            <div className="blog-card-meta">
              <time>{post.date}</time>
              <span>{readingTime(post.readTime, language)}</span>
            </div>
            <h2 className="blog-title">{post.title[language]}</h2>
            <p>{post.dek[language]}</p>
            <a className="text-link" href={`#blog/${post.slug}`}>
              {language === "zh" ? "阅读全文" : "Read article"} <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogArticle({
  post,
  language,
  setLanguage,
}: {
  post: (typeof blogPosts)[number];
  language: BlogLanguage;
  setLanguage: Dispatch<SetStateAction<BlogLanguage>>;
}) {
  return (
    <article className="blog-article section-shell" lang={language === "zh" ? "zh-CN" : "en"}>
      <a className="blog-back" href="#blog">
        {language === "zh" ? "返回博客" : "Back to blog"}
      </a>
      <LanguageToggle language={language} setLanguage={setLanguage} />
      <header className="blog-article-header">
        <div>
          <p className="eyebrow">Research Blog</p>
          <h1 className="blog-title">{post.title[language]}</h1>
          <p>{post.dek[language]}</p>
          <div className="blog-card-meta">
            <time>{post.date}</time>
            <span>{readingTime(post.readTime, language)}</span>
          </div>
        </div>
      </header>
      <div className={`blog-prose ${language === "zh" ? "zh-prose" : ""}`}>
        {post.content[language].map((block, index) => (
          <BlogBlockView block={block} language={language} id={`${post.slug}-block-${index}`} key={`${block.type}-${index}`} />
        ))}
      </div>
    </article>
  );
}

function BlogBlockView({ block, language, id }: { block: BlogBlock; language: BlogLanguage; id: string }) {
  if (block.type === "paragraph") {
    return <p>{renderRichText(block.text)}</p>;
  }

  if (block.type === "heading") {
    return <h2 className="blog-title">{block.text}</h2>;
  }

  if (block.type === "equation") {
    return (
      <div
        className="equation"
        dangerouslySetInnerHTML={{ __html: renderEquation(block.text) }}
      />
    );
  }

  if (block.type === "references") {
    return (
      <ol className="reference-list">
        {block.items.map((item, index) => (
          <li id={`ref-${index + 1}`} key={item}>
            {renderRichText(item)}
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="blog-figure">
        <a href={block.src} target="_blank" rel="noreferrer" aria-label={`${language === "zh" ? "查看完整图片" : "View full-size figure"}: ${block.alt}`}>
          <img src={block.src} alt={block.alt} width={block.width} height={block.height} loading="lazy" decoding="async" />
        </a>
        <figcaption>{renderRichText(block.caption)}</figcaption>
      </figure>
    );
  }

  if (block.type === "table") {
    return (
      <figure className="blog-table-block">
        <div className="blog-table-scroll" role="region" aria-labelledby={`${id}-caption`} tabIndex={0}>
          <table className="blog-data-table" aria-describedby={`${id}-caption`}>
            <thead>
              <tr>{block.headers.map((header, index) => <th scope="col" key={index}>{renderRichText(header)}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === block.highlightedRow ? "highlighted-row" : undefined}>
                  {row.map((cell, columnIndex) => columnIndex === 0
                    ? <th scope="row" key={columnIndex}>{renderRichText(cell)}</th>
                    : <td key={columnIndex}>{renderRichText(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <figcaption id={`${id}-caption`}>{renderRichText(block.caption)}</figcaption>
      </figure>
    );
  }

  return (
    <div className="slide-gallery">
      {Array.from({ length: block.count }, (_, index) => {
        const page = String(index + 1).padStart(2, "0");
        return (
          <figure key={page}>
            <img
              src={`${block.basePath}/page_${page}.png`}
              alt={`PPT page ${index + 1}`}
              loading="lazy"
            />
            <figcaption>PPT page {index + 1}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function renderEquation(source: string) {
  try {
    return katex.renderToString(source, {
      displayMode: true,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return source;
  }
}

function readingTime(value: string, language: BlogLanguage) {
  return language === "zh" ? value.replace("min read", "分钟阅读") : value;
}

function LanguageToggle({
  language,
  setLanguage,
}: {
  language: BlogLanguage;
  setLanguage: Dispatch<SetStateAction<BlogLanguage>>;
}) {
  return (
    <div className="language-toggle" aria-label="Blog language">
      <button
        className={language === "zh" ? "active" : ""}
        onClick={() => setLanguage("zh")}
        type="button"
        aria-pressed={language === "zh"}
      >
        中文
      </button>
      <button
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
        type="button"
        aria-pressed={language === "en"}
      >
        English
      </button>
    </div>
  );
}

function renderRichText(text: string): ReactNode[] {
  const pattern = /\\\(([\s\S]+?)\\\)|\$([^\n$]+)\$|\*\*([\s\S]+?)\*\*|<u>([\s\S]+?)<\/u>|\[([^\]\n]+)\]\((https?:\/\/[^\s]+?)\)|\[(\d+(?:[-–,]\d+)*)\]|\*([^*\n]+)\*|(https?:\/\/[^\s]+)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    const [, parenthesizedMath, dollarMath, strong, underline, linkText, linkUrl, citation, emphasis, bareUrl] = match;

    if (parenthesizedMath || dollarMath) {
      nodes.push(<span className="inline-math" dangerouslySetInnerHTML={{ __html: renderInlineEquation(parenthesizedMath || dollarMath) }} key={index} />);
    } else if (strong) {
      nodes.push(<strong key={index}>{renderRichText(strong)}</strong>);
    } else if (underline) {
      nodes.push(<u key={index}>{renderRichText(underline)}</u>);
    } else if (linkUrl) {
      nodes.push(<a href={linkUrl} key={index}>{renderRichText(linkText)}</a>);
    } else if (citation) {
      const firstRef = citation.split(/[-–,]/)[0];
      nodes.push(
        <sup className="citation" key={index}>
          <button type="button" aria-label={`References ${citation}`} onClick={() => document.getElementById(`ref-${firstRef}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            {citation}
          </button>
        </sup>,
      );
    } else if (emphasis) {
      nodes.push(<em key={index}>{renderRichText(emphasis)}</em>);
    } else if (bareUrl) {
      nodes.push(<a href={bareUrl} key={index}>{bareUrl}</a>);
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderInlineEquation(source: string) {
  try {
    return katex.renderToString(source, {
      displayMode: false,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return source;
  }
}
