"use client";
import { useEffect, useRef } from "react";
import type { Route } from "@/lib/blog/types";

type Props = {page: Route["page"]; dark: boolean; bookmarkCount: number; onTheme: () => void; onExplore: () => void; onWrite: () => void};

export default function Header({page, dark, bookmarkCount, onTheme, onExplore, onWrite}: Props) {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const measure = () => document.documentElement.style.setProperty("--header-height", `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <header ref={header} className="site-header">
    <div className="header-inner">
      <a href="#/explore" className="wordmark" aria-label="Margin home" onClick={onExplore}>margin<span className="wordmark-dot">.</span></a>
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#/explore" aria-current={page === "explore" ? "page" : undefined} onClick={onExplore}>Journal</a>
        <a href="#/bookmarks" aria-current={page === "bookmarks" ? "page" : undefined} onClick={onExplore}>Reading list {bookmarkCount ? <span className="nav-count">{bookmarkCount}</span> : null}</a>
        <a href="#/studio" aria-current={page === "studio" || page === "write" ? "page" : undefined}>My studio</a>
      </nav>
      <div className="header-actions">
        <button className="theme-button" onClick={onTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? "Light mode" : "Dark mode"}</button>
        <button className="button button-primary header-write" onClick={onWrite} aria-label="Write a story"><span>Write<span className="write-extra"> a story</span></span></button>
      </div>
    </div>
  </header>;
}
