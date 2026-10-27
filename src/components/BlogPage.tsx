import { ArrowUpRight } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
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
    <section className="blog-shell section-shell">
      <div className="blog-hero blog-hero-with-toggle">
        <div>
          <p className="eyebrow">Research Blog</p>
          <h1>Notes on AI and scientific modeling</h1>
          <p>
            Longer-form notes on papers, experiments, research ideas, and the
            occasional question that refuses to stay small.
          </p>
        </div>
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </div>
      <div className="blog-list">
        {blogPosts.map((post) => (
          <article className="blog-card" key={post.slug}>
            <div className="blog-card-meta">
              <time>{post.date}</time>
              <span>{post.readTime}</span>
            </div>
            <h2 className="blog-title">{post.title[language]}</h2>
            <p>{post.dek[language]}</p>
            <a className="text-link" href={`#blog/${post.slug}`}>
              Read article <ArrowUpRight size={16} />
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
    <article className="blog-article section-shell">
      <a className="blog-back" href="#blog">
        Back to blog
      </a>
      <LanguageToggle language={language} setLanguage={setLanguage} />
      <header className="blog-article-header">
        <div>
          <p className="eyebrow">Research Blog</p>
          <h1 className="blog-title">{post.title[language]}</h1>
          <p>{post.dek[language]}</p>
          <div className="blog-card-meta">
            <time>{post.date}</time>
            <span>{post.readTime}</span>
          </div>
        </div>
      </header>
      <div className={`blog-prose ${language === "zh" ? "zh-prose" : ""}`}>
        {post.content[language].map((block, index) => (
          <BlogBlockView block={block} key={`${block.type}-${index}`} />
        ))}
      </div>
    </article>
  );
}

function BlogBlockView({ block }: { block: BlogBlock }) {
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
            {item}
          </li>
        ))}
      </ol>
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

function renderTextWithCitations(text: string) {
  const parts = text.split(/(\[\d+(?:[-,]\d+)*\])/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+(?:[-,]\d+)*)\]$/);
    if (!match) return part;

    const firstRef = match[1].split(/[-,]/)[0];
    return (
      <sup className="citation" key={`${part}-${index}`}>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById(`ref-${firstRef}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          {match[1]}
        </button>
      </sup>
    );
  });
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

function renderRichText(text: string) {
  const parts = text.split(/(\\\([^)]+\\\)|\[\d+(?:[-,]\d+)*\])/g);

  return parts.map((part, index) => {
    if (!part) return null;

    const mathMatch = part.match(/^\\\((.+)\\\)$/);
    if (mathMatch) {
      return (
        <span
          className="inline-math"
          dangerouslySetInnerHTML={{
            __html: renderInlineEquation(mathMatch[1]),
          }}
          key={`${part}-${index}`}
        />
      );
    }

    return renderTextWithCitations(part);
  });
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
