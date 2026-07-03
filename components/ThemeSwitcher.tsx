"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "light", label: "Light" },
  { id: "light-blue", label: "Light Blue" },
  { id: "dark", label: "Dark" }
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("noblifi_theme") ?? "dark";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function changeTheme(nextTheme: string) {
    setTheme(nextTheme);
    localStorage.setItem("noblifi_theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  return (
    <div className="mt-auto border-t border-line pt-4">
      <label className="text-xs font-semibold uppercase text-muted">
        Theme
        <select className="field mt-2" value={theme} onChange={(event) => changeTheme(event.target.value)}>
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
