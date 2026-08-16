import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NobliFi",
  description: "WiFi hotspot billing and MikroTik auto-provisioning"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const saved = localStorage.getItem("noblifi_theme"); const theme = saved === "dark" || saved === "light" ? saved : saved === "light-blue" ? "light" : "dark"; localStorage.setItem("noblifi_theme", theme); document.documentElement.dataset.theme = theme; } catch { document.documentElement.dataset.theme = "dark"; } })();`
          }}
        />
        {children}
      </body>
    </html>
  );
}
