"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◉" },
  { href: "/dashboard/agents", label: "Agents", icon: "◈" },
  { href: "/dashboard/policies", label: "Policies", icon: "◇" },
  { href: "/dashboard/logs", label: "Logs", icon: "▤" },
  { href: "/dashboard/budget", label: "Budget", icon: "◫" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <Link href="/" className="logo">
            Limitrum
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}