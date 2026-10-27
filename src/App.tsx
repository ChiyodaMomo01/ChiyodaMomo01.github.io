import { ArrowUpRight } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { HomePage } from "./components/HomePage";
import { ArtCover, ArtCredit } from "./components/ArtDecoration";

const BlogPage = lazy(() => import("./components/BlogPage"));

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  const requested = new URLSearchParams(window.location.search).get("theme");
  if (requested === "light" || requested === "dark") return requested;
  try {
    return window.localStorage.getItem("academic-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function App() {
  const [route, setRoute] = useState(() => getRoute());
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const artDesign = "cover";

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("academic-theme", theme);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.palette = "clay";
    document.documentElement.dataset.art = "cover";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim(),
      );
  }, [theme]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("art") || url.searchParams.has("palette")) {
      url.searchParams.delete("art");
      url.searchParams.delete("palette");
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getInitialTheme());
    };
    window.addEventListener("popstate", syncTheme);
    return () => window.removeEventListener("popstate", syncTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    const url = new URL(window.location.href);
    url.searchParams.set("theme", nextTheme);
    window.history.replaceState(window.history.state, "", url);
  }

  const blogSlug = route.startsWith("blog/")
    ? route.replace("blog/", "")
    : null;
  useEffect(() => {
    if (route.startsWith("blog") || route === "home") {
      window.scrollTo({ top: 0 });
    } else if (route !== "home") {
      document.getElementById(route)?.scrollIntoView({ block: "start" });
    }
  }, [route]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-shell" id="top">
        {!route.startsWith("blog") && <ArtCover />}
        <div className="academic-layout">
          <ProfileSidebar
            theme={theme}
            onToggleTheme={toggleTheme}
            route={route}
          />
          <div className="reading-column">
            <main id="main-content">
              {route === "blog" || blogSlug ? (
                <Suspense
                  fallback={
                    <p className="loading-note" role="status">
                      Loading research notes…
                    </p>
                  }
                >
                  <BlogPage slug={blogSlug} />
                </Suspense>
              ) : (
                <HomePage artDesign={artDesign} />
              )}
            </main>
            <footer className="site-footer">
              <span>© {new Date().getFullYear()} Ruiqi Shu</span>
              <a href="#top">
                Back to top <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </footer>
            <ArtCredit design={artDesign} />
          </div>
        </div>
      </div>
    </>
  );
}

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return !hash || hash === "top" ? "home" : hash;
}

export default App;
