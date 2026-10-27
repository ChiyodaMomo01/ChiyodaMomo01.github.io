import { ArrowDown, ArrowUpRight } from "lucide-react";
import { artworks, getArtDesign, type ArtDesignId } from "../data/artDesigns";
import { profile } from "../data/profile";

export function ArtFigure({ design }: { design: ArtDesignId }) {
  const selected = getArtDesign(design);
  if (!selected || design === "cover") return null;
  const work = artworks[selected.work];
  return (
    <figure className="art-figure">
      <a
        className="art-image-link"
        href={work.source}
        target="_blank"
        rel="noreferrer"
        aria-label={`View ${work.title} at ${work.museum}`}
      >
        <img
          src={work.image}
          alt={work.alt}
          width={work.width}
          height={work.height}
          fetchPriority="high"
        />
      </a>
      <figcaption className="art-caption">
        <span>
          Giorgio de Chirico <span className="art-caption-dot">·</span>{" "}
          <i>{work.title}</i>
        </span>
        <a href={work.source} target="_blank" rel="noreferrer">
          {work.museum} <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

export function ArtCover() {
  const work = artworks.station;
  return (
    <section className="art-cover" aria-label="Ruiqi Shu homepage cover">
      <img
        className="art-cover-image"
        src={work.image}
        width={work.width}
        height={work.height}
        alt={work.alt}
        fetchPriority="high"
      />
      <div className="art-cover-content">
        <p className="art-cover-kicker">LEARNING THE PHYSICAL WORLD</p>
        <p className="art-cover-name">
          {profile.name}
          <span lang="zh-CN">{profile.chineseName}</span>
        </p>
        <p className="art-cover-role">PhD Candidate · Tsinghua University</p>
        <a className="art-cover-enter" href="#about">
          Explore my research <ArrowDown size={18} aria-hidden="true" />
        </a>
      </div>
      <a
        className="art-cover-credit"
        href={work.source}
        target="_blank"
        rel="noreferrer"
      >
        Giorgio de Chirico · {work.title}, {work.date}{" "}
        <ArrowUpRight size={13} aria-hidden="true" />
      </a>
    </section>
  );
}

export function ArtCredit({ design }: { design: ArtDesignId }) {
  const selected = getArtDesign(design);
  if (!selected) return null;
  const work = artworks[selected.work];
  return (
    <p className="art-source-note">
      Artwork: Giorgio de Chirico, <i>{work.title}</i>, {work.date}.{" "}
      <a href={work.source} target="_blank" rel="noreferrer">
        {work.museum}
      </a>
      . {work.credit}.
    </p>
  );
}
