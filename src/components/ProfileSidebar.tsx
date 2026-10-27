import {
  ArrowUpRight,
  BookOpen,
  Download,
  Github,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
} from "lucide-react";
import { navItems, profile } from "../data/profile";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  route: string;
};

export function ProfileSidebar({ theme, onToggleTheme, route }: Props) {
  return (
    <aside className="profile-sidebar" aria-label="Personal profile">
      <a className="portrait-link" href="#top" aria-label="Ruiqi Shu home">
        <img
          className="portrait"
          src={profile.photo}
          alt="Ruiqi Shu"
          width="260"
          height="300"
          fetchPriority="high"
        />
      </a>
      <div className="identity">
        <a className="profile-name" href="#top">
          {profile.name}
        </a>
        <p className="chinese-name" lang="zh-CN">
          {profile.chineseName}
        </p>
        <p className="profile-role">PhD Candidate</p>
        <p className="profile-affiliation">
          Department of Earth System Science
          <br />
          <a href="https://www.tsinghua.edu.cn/en/">Tsinghua University</a>
        </p>
      </div>
      <div className="profile-actions">
        <a href="#blog">
          Blog <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <a href={profile.cv} download>
          CV <Download size={15} aria-hidden="true" />
        </a>
        <a href={profile.cvZh} download lang="zh-CN">
          中文 CV <Download size={15} aria-hidden="true" />
        </a>
      </div>
      <ul className="contact-list">
        <li>
          <Mail size={16} aria-hidden="true" />
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <BookOpen size={16} aria-hidden="true" />
          <a href={profile.scholar}>
            Google Scholar <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </li>
        <li>
          <Github size={16} aria-hidden="true" />
          <a href={profile.github}>
            GitHub <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </li>
        <li>
          <MessageCircle size={16} aria-hidden="true" />
          <span>{profile.wechat}</span>
        </li>
        <li>
          <MapPin size={16} aria-hidden="true" />
          <span>{profile.location}</span>
        </li>
      </ul>
      <details className="sidebar-contents">
        <summary>On this page</summary>
        <nav className="sidebar-nav" aria-label="Section navigation">
          {navItems.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={
                route === id || (id === "blog" && route.startsWith("blog/"))
                  ? "location"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </details>
      <button
        className="theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon size={15} aria-hidden="true" />
        ) : (
          <Sun size={15} aria-hidden="true" />
        )}
        <span>{theme === "light" ? "Dark" : "Light"} appearance</span>
      </button>
    </aside>
  );
}
