import { ArrowUpRight } from "lucide-react";
import { blogIndex } from "../data/blogIndex";
import {
  awards,
  experience,
  miscellaneous,
  news,
  presentations,
  profile,
  services,
  type TimelineItem,
} from "../data/profile";
import { PublicationList } from "./PublicationList";
import { ArtFigure } from "./ArtDecoration";
import type { ArtDesignId } from "../data/artDesigns";

function Timeline({
  items,
  compact = false,
}: {
  items: TimelineItem[];
  compact?: boolean;
}) {
  return (
    <div className={`timeline ${compact ? "timeline-compact" : ""}`}>
      {items.map((item) => (
        <article className="timeline-item" key={`${item.date}-${item.title}`}>
          <time>{item.date}</time>
          <div>
            <h3>{item.title}</h3>
            <p className="place">{item.place}</p>
            <p className="timeline-detail">{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HomePage({ artDesign }: { artDesign: ArtDesignId }) {
  return (
    <>
      <section
        className={`about-section art-about art-about-${artDesign}`}
        id="about"
        aria-labelledby="about-heading"
      >
        <h1 className="sr-only" id="about-heading">
          Ruiqi Shu: Learning the Physical World
        </h1>
        <ArtFigure design={artDesign} />
        <div className="about-copy">
          <p className="intro-lede">
            I study how <em>machine learning</em> and <em>numerical simulation</em>
            {" "}can help us understand and model the physical world.
          </p>
          <p className="intro-bio">
            I am a PhD candidate in the Department of Earth System Science at{" "}
            <a href="https://www.tsinghua.edu.cn/en/">Tsinghua University</a>,
            supervised by Xiaomeng Huang.
          </p>
          <p className="intro-bio">
            My research centers on learning the dynamics of physical systems.
            I am interested in differentiable numerical solvers, hybrid
            physics-learning models, and physically consistent world models
            for simulation and prediction.
            {" "}Earth systems, including the atmosphere and oceans, provide
            concrete settings for this research.
          </p>
          <a className="research-link" href={profile.neuralPom}>
            Explore Neural-POM <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <PublicationList />

      <section
        className="content-section news-section"
        id="news"
        aria-labelledby="news-heading"
      >
        <h2 id="news-heading">Recent news</h2>
        <div className="news-list">
          {news.slice(0, 2).map((item) => (
            <article className="news-item" key={item.date}>
              <time>{item.date}</time>
              <p>
                <strong>{item.label}</strong> {item.text}
              </p>
            </article>
          ))}
        </div>
        <details className="news-archive">
          <summary>Earlier news</summary>
          <div className="news-list">
            {news.slice(2).map((item) => (
              <article className="news-item" key={`${item.date}-${item.label}`}>
                <time>{item.date}</time>
                <p>
                  <strong>{item.label}</strong> {item.text}
                </p>
              </article>
            ))}
          </div>
        </details>
      </section>

      <section
        className="content-section"
        id="experience"
        aria-labelledby="experience-heading"
      >
        <h2 id="experience-heading">Education & experience</h2>
        <Timeline items={experience} />
      </section>
      <section
        className="content-section"
        id="presentations"
        aria-labelledby="presentations-heading"
      >
        <h2 id="presentations-heading">Presentations</h2>
        <Timeline items={presentations} />
      </section>
      <section
        className="content-section"
        id="awards"
        aria-labelledby="awards-heading"
      >
        <h2 id="awards-heading">Honors & awards</h2>
        <Timeline
          items={[...awards].sort((a, b) => Number(b.date) - Number(a.date))}
          compact
        />
      </section>
      <section
        className="content-section"
        id="service"
        aria-labelledby="service-heading"
      >
        <h2 id="service-heading">Academic service</h2>
        <div className="service-content">
          <div>
            <h3>Reviewer</h3>
            <p>{services.reviewer.join(", ")}</p>
          </div>
          <div>
            <h3>Research interests</h3>
            <p>{services.areas.join(" / ")}</p>
          </div>
        </div>
      </section>

      <section
        className="content-section notes-section"
        aria-labelledby="notes-heading"
      >
        <div className="section-heading">
          <h2 id="notes-heading">Research notes</h2>
          <a className="section-link" href="#blog">
            Visit the blog <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        {blogIndex.map((post) => (
          <a
            className="note-preview"
            href={`#blog/${post.slug}`}
            key={post.slug}
          >
            <time>{post.date}</time>
            <h3>{post.title.en}</h3>
            <p>{post.dek.en}</p>
            <span className="note-read">
              Read note <ArrowUpRight size={15} aria-hidden="true" />
            </span>
          </a>
        ))}
      </section>

      <section
        className="content-section miscellaneous-section"
        id="miscellaneous"
        aria-labelledby="misc-heading"
      >
        <h2 id="misc-heading">Away from research</h2>
        <div className="misc-content">
          <div>
            <h3>On two wheels</h3>
            <p>{miscellaneous.text}</p>
            <a
              className="text-link"
              href={miscellaneous.bikeImage}
              target="_blank"
              rel="noreferrer"
            >
              My road bike <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <a
            className="bike-preview"
            href={miscellaneous.bikeImage}
            target="_blank"
            rel="noreferrer"
            aria-label="View Ruiqi Shu's road bike"
          >
            <img
              src={miscellaneous.bikeImage}
              alt="Ruiqi Shu's road bike"
              loading="lazy"
              width="280"
              height="200"
            />
          </a>
        </div>
      </section>
    </>
  );
}
