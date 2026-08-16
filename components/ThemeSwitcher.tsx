"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" }
] as const;

type ThemeId = (typeof themes)[number]["id"];

function normalizeTheme(value: string | null): ThemeId {
  if (value === "light" || value === "dark") {
    return value;
  }

  return value === "light-blue" ? "light" : "dark";
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("dark");

  useEffect(() => {
    const saved = normalizeTheme(localStorage.getItem("noblifi_theme"));
    setTheme(saved);
    localStorage.setItem("noblifi_theme", saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function changeTheme(nextTheme: ThemeId) {
    setTheme(nextTheme);
    localStorage.setItem("noblifi_theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  return (
    <div className="mt-auto border-t border-line pt-4">
      <label className="text-xs font-semibold uppercase text-muted">
        Theme
        <select className="field mt-2" value={theme} onChange={(event) => changeTheme(normalizeTheme(event.target.value))}>
          {themes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
