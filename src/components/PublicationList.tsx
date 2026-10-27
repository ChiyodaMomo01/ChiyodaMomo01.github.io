import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { publications } from "../data/publications";
import { profile } from "../data/profile";

const selectedTitles = [
  "HybridOM:",
  "Ocean-E2E:",
  "OneForecast:",
  "Advanced forecasts of global extreme marine heatwaves",
];
const selected = publications.filter((paper) =>
  selectedTitles.some((title) => paper.title.startsWith(title)),
);

function Authors({ text }: { text: string }) {
  return (
    <>
      {text.split(profile.name).map((part, index) => (
        <span key={index}>
          {index > 0 && <strong>{profile.name}</strong>}
          {part}
        </span>
      ))}
    </>
  );
}

export function PublicationList() {
  const [scope, setScope] = useState<"selected" | "all">("selected");
  const [year, setYear] = useState("all");
  const papers = (scope === "selected" ? selected : publications).filter(
    (paper) => year === "all" || paper.date.includes(year),
  );
  return (
    <section
      className="content-section publications-section"
      id="publications"
      aria-labelledby="publications-heading"
    >
      <div className="section-heading">
        <h2 id="publications-heading">Publications</h2>
        <a className="section-link" href={profile.scholar}>
          Google Scholar <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
      <div className="publication-controls">
        <div
          className="scope-toggle"
          role="group"
          aria-label="Publication selection"
        >
          <button
            type="button"
            aria-pressed={scope === "selected"}
            onClick={() => setScope("selected")}
          >
            Selected <span>{selected.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={scope === "all"}
            onClick={() => setScope("all")}
          >
            All papers <span>{publications.length}</span>
          </button>
        </div>
        <label className="year-filter">
          <span className="sr-only">Filter publications by year</span>
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="all">All years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </label>
      </div>
      <p className="sr-only" role="status">
        Showing {papers.length} publications.
      </p>
      <div className="publication-list">
        {papers.map((paper) => (
          <article className="publication" key={paper.title}>
            <a
              className="paper-figure"
              href={paper.links[0]?.url ?? profile.scholar}
              aria-label={`Read ${paper.title.replace(/\s+\[[^\]]+\]$/, "")}`}
            >
              {paper.image ? (
                <img
                  src={paper.image}
                  alt={`${paper.title.split("[")[0].trim()} research figure`}
                  loading="lazy"
                  width="280"
                  height="200"
                />
              ) : (
                <span>{paper.imageStatus ?? "Research publication"}</span>
              )}
            </a>
            <div className="paper-body">
              <div className="paper-meta">
                <span>{paper.date}</span>
                <span
                  className={`author-role ${paper.role === "Co-author" ? "" : "lead-author"}`}
                >
                  {paper.role}
                </span>
              </div>
              <h3>
                <a href={paper.links[0]?.url ?? profile.scholar}>
                  {paper.title.replace(/\s+\[[^\]]+\]$/, "")}
                </a>
              </h3>
              <p className="authors">
                <Authors text={paper.authors} />
              </p>
              <p className="paper-venue">{paper.venue}</p>
              <p className="paper-summary">{paper.summary}</p>
              <div className="paper-links">
                {paper.links.map((link) => (
                  <a href={link.url} key={link.url}>
                    {link.label} <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {papers.length === 0 && (
        <p className="empty-state">
          No publications in this selection. Choose another year or view all
          papers.
        </p>
      )}
      {scope === "selected" && (
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setScope("all");
            setYear("all");
          }}
        >
          View all {publications.length} papers{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
