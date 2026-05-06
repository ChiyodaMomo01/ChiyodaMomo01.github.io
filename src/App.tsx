import {
  ArrowUpRight,
  Award,
  BookOpen,
  Github,
  GraduationCap,
  Globe2,
  Mail,
  MapPin,
  Microscope,
  Newspaper,
  Bike,
  Sparkles,
} from "lucide-react";
import { awards, experience, miscellaneous, navItems, news, profile, services, visitorMap } from "./data/profile";
import { publications } from "./data/publications";

function App() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ruiqi Shu home">
          RS
        </a>
        <nav className="nav-links" aria-label="Section navigation">
          {navItems.map(([label, id]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero section-shell" id="about">
          <div className="hero-copy">
            <p className="eyebrow">AI for Earth System Science</p>
            <h1>
              {profile.name}
              <span>{profile.chineseName}</span>
            </h1>
            <p className="hero-title">{profile.title}</p>
            <p className="hero-text">
              I am a PhD student in the Department of Earth System Science at Tsinghua University and a research intern at the
              Shanghai Academy of AI for Science. I received my BSc from Chongben Honors College, Ocean University of China in
              2024.
            </p>
            <p className="hero-text">
              My research focuses on combining artificial intelligence with physics to understand, predict, and reason about
              complex geophysical systems. In particular, I work on differentiable formulations of traditional geophysical
              solvers, especially atmospheric and oceanic models, and their deep integration with neural networks.
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
            </div>
          </div>
          <aside className="hero-side" aria-label="Portrait and research highlight">
            <div className="portrait-card">
              <img src={profile.photo} alt="Portrait of Ruiqi Shu" />
            </div>
            <div className="hero-panel">
              <p className="panel-label">Current focus</p>
              <h2>Differentiable ocean modeling with machine learning</h2>
              <p>
                I am actively recruiting and looking for collaborators interested in coupling a full differentiable ocean
                numerical model with machine learning.
              </p>
              <a href={profile.neuralPom} className="text-link">
                Explore Neural-POM <ArrowUpRight size={16} />
              </a>
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
            {publications.map((paper) => (
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
                  <h3>{paper.title}</h3>
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
            ))}
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

        <Section id="visitors" label="Visitor Map" icon={<Globe2 size={22} />}>
          <div className="visitor-card">
            <div className="visitor-map-frame">
              <a href={visitorMap.linkUrl} target="_blank" rel="noreferrer" aria-label="Open visitor map details">
                <img src={visitorMap.imageUrl} srcSet={visitorMap.imageSrcSet} alt="World map of homepage visitors" />
              </a>
            </div>
            <div className="visitor-copy">
              <h3>Global Visitors</h3>
              <p>{visitorMap.note}</p>
              <a href={visitorMap.linkUrl} target="_blank" rel="noreferrer">
                View tracker details <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </Section>
      </main>

      <footer>
        <p>© {new Date().getFullYear()} Ruiqi Shu. Built for GitHub Pages.</p>
      </footer>
    </>
  );
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
