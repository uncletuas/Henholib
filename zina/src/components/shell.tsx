import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  Activity,
  BarChart3,
  CreditCard,
  UserCheck,
  Database,
  FileClock,
  Grid2x2,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";

import { api } from "../lib/api";
import type { ManagedApp, Permission } from "../lib/api";
import { useSession } from "../lib/session";
import { AppMark, Avatar, Button, cx } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
}

/**
 * The whole of Zina in one list.
 *
 * The order is the order the work happens in: see the state of things, then the
 * people, then the money, then the machinery. Each entry declares the permission
 * that reveals it, so a support agent's sidebar is genuinely shorter rather than
 * full of links that 403.
 */
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/", label: "At a glance", icon: LayoutDashboard, permission: "app:read" },
      { to: "/apps", label: "Apps", icon: Grid2x2, permission: "app:read" },
      { to: "/analytics", label: "Analytics", icon: BarChart3, permission: "analytics:read" },
    ],
  },
  {
    group: "Customers",
    items: [
      { to: "/users", label: "Users", icon: Users, permission: "user:read" },
      { to: "/payments", label: "Payments", icon: CreditCard, permission: "billing:read" },
      { to: "/onboarding", label: "Onboarding", icon: UserCheck, permission: "onboarding:read" },
      { to: "/support", label: "Support", icon: LifeBuoy, permission: "support:read" },
      { to: "/notifications", label: "Notifications", icon: Mail, permission: "notify:read" },
    ],
  },
  {
    group: "Platform",
    items: [
      { to: "/keys", label: "API keys", icon: KeyRound, permission: "secret:read" },
      { to: "/databases", label: "Databases", icon: Database, permission: "system:read" },
      { to: "/staff", label: "Staff & roles", icon: Activity, permission: "staff:manage" },
      { to: "/audit", label: "Audit log", icon: FileClock, permission: "audit:read" },
    ],
  },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("zina.theme");
      if (saved) return saved === "dark";
    } catch {
      /* ignore */
    }
    return true; // a console is dark by default
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("zina.theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

/**
 * The list of apps the superadmin can step into.
 *
 * Loaded once in the shell rather than per-screen: it is navigation, and it is
 * the thing the user asked for most directly — everything in one place, with a
 * way into each app from wherever you happen to be.
 */
function SwitchInto({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useSession();
  const [apps, setApps] = useState<ManagedApp[]>([]);

  useEffect(() => {
    if (!can("app:read")) return;
    api
      .apps()
      .then(({ apps }) => setApps(apps.filter((a) => a.enabled)))
      .catch(() => setApps([]));
  }, [can]);

  if (!can("app:switch") || !apps.length) return null;

  return (
    <div className="px-3 py-4">
      <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[color:var(--sidebar-muted)]">
        Manage
      </p>
      <ul className="space-y-0.5">
        {apps.map((app) => (
          <li key={app.id}>
            {/* Straight to the app's dashboard inside Zina. The hop out to its
                own portal lives on that page, where it can explain itself. */}
            <NavLink
              to={`/apps/${app.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cx(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-[color:var(--sidebar-accent)] font-semibold text-white"
                    : "text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)]"
                )
              }
            >
              <AppMark name={app.name} accent={app.accent} size={20} />
              <span className="min-w-0 flex-1 truncate">{app.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { can, staff } = useSession();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
            <path d="M6 7h12l-8 10h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-[color:var(--sidebar-foreground)]">Zina</p>
          <p className="text-[11px] text-[color:var(--sidebar-muted)]">zina.loopital.com</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {NAV.map((group) => {
          const items = group.items.filter((item) => can(item.permission));
          if (!items.length) return null;
          return (
            <div key={group.group} className="mb-4">
              <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[color:var(--sidebar-muted)]">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cx(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                          isActive
                            ? "bg-[color:var(--sidebar-accent)] font-semibold text-white"
                            : "text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)]"
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[color:var(--sidebar-border)]">
        <SwitchInto onNavigate={onNavigate} />
      </div>

      {staff && staff.appScope.length > 0 && (
        <div className="border-t border-[color:var(--sidebar-border)] px-4 py-3">
          <p className="text-[11px] text-[color:var(--sidebar-muted)]">
            Your access is limited to {staff.appScope.join(", ")}.
          </p>
        </div>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { staff, signOut } = useSession();
  const { dark, toggle } = useTheme();
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 bg-[color:var(--sidebar)] lg:block">
        <SidebarContent />
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/55" onClick={() => setMobileNav(false)} />
          <div className="absolute inset-y-0 left-0 w-[268px] bg-[color:var(--sidebar)]">
            <button
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3 rounded-md p-1.5 text-[color:var(--sidebar-foreground)]"
            >
              <X className="size-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-[color:var(--background)]/92 px-4 py-2.5 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
            className="rounded-md p-1.5 hover:bg-[color:var(--muted-surface)] lg:hidden"
          >
            <Menu className="size-4.5" />
          </button>

          <div className="flex-1" />

          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light" : "Switch to dark"}
            className="rounded-md p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted-surface)]"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {staff && (
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-[12.5px] font-semibold leading-tight">{staff.name}</p>
                <p className="text-[11.5px] leading-tight text-[color:var(--muted-foreground)]">
                  {staff.roleLabel}
                </p>
              </div>
              <Avatar name={staff.name} src={staff.avatarUrl} size={30} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
