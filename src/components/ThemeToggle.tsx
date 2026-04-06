"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="text-text-muted hover:text-text-primary transition-colors"
      title={dark ? "切換淺色模式" : "切換深色模式"}
      aria-label={dark ? "切換淺色模式" : "切換深色模式"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
