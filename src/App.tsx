import {
  ArrowUpRight,
  Award,
  BookOpen,
  Download,
  Github,
  GraduationCap,
  Mail,
  MapPin,
  Microscope,
  Moon,
  Newspaper,
  Bike,
  PenLine,
  Sparkles,
  Sun,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { blogPosts, type BlogBlock, type BlogLanguage } from "./data/blog";
import { awards, experience, miscellaneous, navItems, news, profile, services } from "./data/profile";
import { publications } from "./data/publications";

type Theme = "dark" | "light";

function splitPublicationTitle(title: string) {
  const match = title.match(/^(.*)\s+\[([^\]]+)\]$/);
  return match ? { title: match[1], venue: match[2] } : { title };
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem("theme") === "light" ? "light" : "dark";
}

function App() {
  const [route, setRoute] = useState(() => getRoute());
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const blogSlug = route.startsWith("blog/") ? route.replace("blog/", "") : null;
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ruiqi Shu home">
          RS
        </a>
        <div className="header-actions">
          <nav className="nav-links" aria-label="Section navigation">
            {navItems.map(([label, id]) => (
              <a href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <main id="top">
        {route === "blog" || blogSlug ? (
          <BlogPage slug={blogSlug} />
        ) : (
          <HomePage />
        )}
      </main>

      <footer>
        <p>© {new Date().getFullYear()} Ruiqi Shu. Built for GitHub Pages.</p>
      </footer>
    </>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero section-shell" id="about">
          <div className="hero-copy">
            <p className="eyebrow">{profile.title}</p>
            <h1>
              {profile.name}
              <span>{profile.chineseName}</span>
            </h1>
            <p className="hero-text hero-lede">
              I build neural-physics models for oceans, weather, and Earth systems, with differentiable solvers at the center.
            </p>
            <div className="hero-actions">
              <a className="button primary" href={`mailto:${profile.email}`}>
                <Mail size={18} />
                Email
              </a>
              <a className="button" href={profile.github}>
                <Github size={18} />
                GitHub
              </a>
              <a className="button" href={profile.scholar}>
                <BookOpen size={18} />
                Scholar
              </a>
              <a className="button" href={profile.cv} download>
                <Download size={18} />
                Download CV
              </a>
              <a className="button" href={profile.cvZh} download>
                <Download size={18} />
                中文 CV
              </a>
            </div>
            <p className="hero-note">{profile.affiliation}</p>
          </div>
          <aside className="hero-side" aria-label="Portrait and research highlight">
            <div className="portrait-card">
              <img src={profile.photo} alt="Portrait of Ruiqi Shu" />
            </div>
            <div className="hero-panel-stack">
              <div className="hero-panel">
                <div className="hero-panel-content">
                  <p className="panel-label">Current focus</p>
                  <h2>Differentiable ocean modeling with machine learning</h2>
                  <a href={profile.neuralPom} className="text-link">
                    Neural-POM <ArrowUpRight size={16} />
                  </a>
                </div>
                <div className="hero-panel-icon" aria-hidden="true">
                  <Microscope size={30} />
                </div>
              </div>
              <div className="hero-panel blog-entry-panel">
                <div className="hero-panel-content">
                  <p className="panel-label">Research blog</p>
                  <h2>Notes on AI and scientific modeling</h2>
                  <a href="#blog" className="text-link blog-panel-link">
                    Blog <PenLine size={16} />
                  </a>
                </div>
                <div className="hero-panel-icon blog-panel-icon" aria-hidden="true">
                  <PenLine size={30} />
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="metrics-band" aria-label="Profile facts">
          <div>
            <MapPin size={18} />
            <span>{profile.location}</span>
          </div>
          <div>
            <Microscope size={18} />
            <span>Differentiable geophysical solvers</span>
          </div>
          <div>
            <BookOpen size={18} />
            <span>{profile.scholarStatus}</span>
          </div>
        </section>

        <Section id="news" label="News" icon={<Newspaper size={22} />}>
          <div className="news-list">
            {news.map((item) => (
              <article className="news-item" key={`${item.date}-${item.label}`}>
                <time>{item.date}</time>
                <div>
                  <span>{item.label}</span>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="publications" label="Publications" icon={<BookOpen size={22} />}>
          <div className="publication-list">
            {publications.map((paper) => {
              const paperTitle = splitPublicationTitle(paper.title);

              return (
                <article className="publication-card" key={paper.title}>
                  <div className="paper-figure">
                    {paper.image ? <img src={paper.image} alt={`${paper.title} representative figure`} /> : <span>{paper.imageStatus ?? "Figure pending"}</span>}
                  </div>
                  <div className="paper-body">
                    <div className="paper-meta">
                      <span className="badge">{paper.role}</span>
                      <span>{paper.venue}</span>
                      <span>{paper.date}</span>
                    </div>
                    <h3>
                      {paperTitle.title}
                      {paperTitle.venue ? <span className="venue-tag">{paperTitle.venue}</span> : null}
                    </h3>
                    <p className="authors">{paper.authors}</p>
                    <p className="paper-summary">{paper.summary}</p>
                    {paper.links.length > 0 && (
                      <div className="paper-links">
                        {paper.links.map((link) => (
                          <a href={link.url} key={link.url}>
                            {link.label}
                            <ArrowUpRight size={14} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Section>

        <Section id="awards" label="Awards" icon={<Award size={22} />}>
          <Timeline items={awards} />
        </Section>

        <Section id="experience" label="Experience" icon={<GraduationCap size={22} />}>
          <Timeline items={experience} />
        </Section>

        <Section id="service" label="Service" icon={<Sparkles size={22} />}>
          <div className="service-grid">
            <div>
              <h3>Reviewer</h3>
              <div className="chip-row">
                {services.reviewer.map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3>Research Areas</h3>
              <div className="chip-row">
                {services.areas.map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="miscellaneous" label="Miscellaneous" icon={<Bike size={22} />}>
          <div className="misc-card">
            <div>
              <h3>Road Cycling</h3>
              <p>
                {miscellaneous.text} Click here to{" "}
                <a href={miscellaneous.bikeImage} target="_blank" rel="noreferrer">
                  view my road bike
                </a>
                .
              </p>
            </div>
            <a className="bike-preview" href={miscellaneous.bikeImage} target="_blank" rel="noreferrer" aria-label="View my road bike">
              <img src={miscellaneous.bikeImage} alt="Ruiqi Shu's road bike" />
            </a>
          </div>
        </Section>

    </>
  );
}

function BlogPage({ slug }: { slug: string | null }) {
  const [language, setLanguage] = useState<BlogLanguage>("zh");
  const activePost = useMemo(() => {
    if (!slug) return null;
    return blogPosts.find((post) => post.slug === slug) ?? null;
  }, [slug]);

  if (activePost) {
    return <BlogArticle post={activePost} language={language} />;
  }

  return (
    <section className="blog-shell section-shell">
      <div className="blog-hero blog-hero-with-toggle">
        <div>
          <p className="eyebrow">Research Blog</p>
          <h1>Notes on AI and scientific modeling</h1>
          <p>
            Longer-form notes on papers, experiments, research ideas, and the occasional question that refuses to stay small.
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
}: {
  post: (typeof blogPosts)[number];
  language: BlogLanguage;
}) {
  return (
    <article className="blog-article section-shell">
      <a className="blog-back" href="#blog">
        Back to blog
      </a>
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
    return <div className="equation" dangerouslySetInnerHTML={{ __html: renderEquation(block.text) }} />;
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
            <img src={`${block.basePath}/page_${page}.png`} alt={`PPT page ${index + 1}`} loading="lazy" />
            <figcaption>PPT page {index + 1}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash || hash === "top") return "home";
  return hash;
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
          onClick={() => document.getElementById(`ref-${firstRef}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
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
      <button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")} type="button">
        中文
      </button>
      <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} type="button">
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
          dangerouslySetInnerHTML={{ __html: renderInlineEquation(mathMatch[1]) }}
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

function Section({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="section-shell content-section" id={id}>
      <div className="section-heading">
        {icon}
        <h2>{label}</h2>
      </div>
      {children}
    </section>
  );
}

function Timeline({ items }: { items: { date: string; title: string; place: string; detail: string }[] }) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <article className="timeline-item" key={`${item.date}-${item.title}`}>
          <time>{item.date}</time>
          <div>
            <h3>{item.title}</h3>
            <p className="place">{item.place}</p>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default App;
