import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { LogOut, Settings, ChevronDown, ArrowRight, HelpCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { openPalWorkspace } from "../lib/pal";
import { launchProductApp } from "../lib/api";
import { productById } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";

const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "U";

/** Google-style account button: avatar → dropdown with an app launcher. */
export function AccountMenu() {
  const { user, token, signOut, setShowAuth, setShowPalOnboarding, setPendingPal, setShowGuide , setShowPalWaitlist } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!user) return null;
  const pal = productById("stack62");
  const launchPal = () => { setOpen(false); openPalWorkspace({ user, token, setShowAuth, setShowPalOnboarding, setPendingPal, setShowPalWaitlist }); };

  // Apps this one account unlocks. Pal alone since Swift was folded into it —
  // social is now a surface inside the workspace, not a second app to launch.
  const apps = [
    { name: pal.name, onClick: launchPal, node: <ImageWithFallback src={pal.logo} alt={pal.name} className="w-6 h-6 object-contain" />, chip: "#fff", soon: false },
  ];

  const avatar = (size: number) =>
    user.avatarUrl ? (
      <img src={user.avatarUrl} alt={user.name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    ) : (
      <span className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ width: size, height: size, background: gradientBrand, fontSize: size * 0.4 }}>
        {initials(user.name)}
      </span>
    );

  const tileInner = (a: typeof apps[number]) => (
    <>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.chip, border: a.chip === "#fff" ? `1px solid ${colors.hairline}` : "none" }}>{a.node}</div>
      <span style={{ fontSize: "12px", fontWeight: 600, color: colors.heading }}>{a.name}</span>
      {a.soon && <span className="absolute top-1 right-1" style={{ fontSize: "8.5px", fontWeight: 700, color: colors.textTertiary, background: colors.surfaceMuted, borderRadius: "999px", padding: "1px 5px" }}>SOON</span>}
    </>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-colors hover:bg-[#F5F5F7]" aria-label="Account">
        {avatar(32)}
        <ChevronDown size={14} style={{ color: colors.textSecondary, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden" style={{ background: colors.surface, boxShadow: "0 30px 80px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05)" }}>
          <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
            {avatar(40)}
            <div className="min-w-0">
              <p style={{ fontWeight: 700, fontSize: "14px", color: colors.heading, lineHeight: 1.2 }} className="truncate">{user.name}</p>
              <p style={{ fontSize: "12.5px", color: colors.textTertiary }} className="truncate">{user.email}</p>
            </div>
          </div>

          <div className="p-3 pb-1">
            <button onClick={launchPal} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-white transition-all hover:opacity-95" style={{ background: gradientBrand }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white flex-shrink-0"><ImageWithFallback src={pal.logo} alt="Pal" className="w-5 h-5 object-contain" /></span>
              <span className="flex-1" style={{ fontSize: "13.5px", fontWeight: 700 }}>Open your Pal workspace</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="p-3 pt-2">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", color: colors.textTertiary, marginBottom: "8px" }}>YOUR APPS</p>
            <div className="grid grid-cols-3 gap-1.5">
              {apps.map((a) => a.onClick ? (
                <button key={a.name} onClick={a.onClick} className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors hover:bg-[#F5F5F7]">{tileInner(a)}</button>
              ) : (
                <Link key={a.name} to={a.to!} onClick={() => setOpen(false)} className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors hover:bg-[#F5F5F7]">{tileInner(a)}</Link>
              ))}
            </div>
          </div>

          <div className="p-2" style={{ borderTop: `1px solid ${colors.hairline}` }}>
            <button onClick={() => { setShowGuide(true); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F5F7]" style={{ fontSize: "13.5px", color: colors.heading }}>
              <HelpCircle size={16} style={{ color: colors.textSecondary }} /> How to use Loopital
            </button>
            <button onClick={() => { setShowAuth("dashboard"); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F5F7]" style={{ fontSize: "13.5px", color: colors.heading }}>
              <Settings size={16} style={{ color: colors.textSecondary }} /> Manage account
            </button>
            <button onClick={() => { signOut(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F5F7]" style={{ fontSize: "13.5px", color: colors.heading }}>
              <LogOut size={16} style={{ color: colors.textSecondary }} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
