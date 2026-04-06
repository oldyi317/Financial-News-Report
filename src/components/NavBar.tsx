"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, Archive, Rss } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "首頁", icon: null, exact: true },
  { href: "/search", label: "搜尋", icon: Search },
  { href: "/archive", label: "歷史", icon: Archive },
];

export default function NavBar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base md:text-lg font-bold text-primary whitespace-nowrap">
          <BarChart3 className="w-5 h-5" />
          每日財經新聞
        </Link>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          {NAV_LINKS.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={`rounded-sm px-1 py-0.5 transition-colors ${
                isActive(href, exact)
                  ? "text-primary font-medium"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="/feed.xml"
            className="text-text-secondary hover:text-text-primary transition-colors rounded-sm px-1 py-0.5"
            title="RSS 訂閱"
          >
            <Rss className="w-4 h-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
