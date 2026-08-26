import { useEffect, useRef, useState } from "react";

/**
 * Henholib, running.
 *
 * Six screens from the real app, redrawn at natural size and scaled into a
 * phone, cycling on a timer. A screenshot says the app exists; this says it
 * works, which is the thing a visitor is actually deciding.
 *
 * Everything here is drawn, not photographed, so it stays sharp at any size and
 * weighs nothing. The data is invented and deliberately unremarkable.
 */

const ORANGE = "#F26D21";
const RED = "#F03E3E";
const INK = "#16181D";
const MUTED = "#8A8F98";
const BG = "#EEF0F5";
const CARD = "#FFFFFF";

const SCREENS = ["Home", "Care", "Wallet", "Health", "SOS"] as const;
type Screen = (typeof SCREENS)[number];

/** Phone chassis. Authored at 320px wide, then scaled to fit its slot. */
function Phone({ children, scale }: { children: React.ReactNode; scale: number }) {
  return (
    <div
      style={{
        width: 320 * scale,
        height: 660 * scale,
        borderRadius: 44 * scale,
        padding: 9 * scale,
        background: "linear-gradient(160deg,#2A2D34,#14161A)",
        boxShadow: "0 40px 90px rgba(15,23,41,0.30), 0 6px 18px rgba(15,23,41,0.14)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 36 * scale,
          overflow: "hidden",
          background: BG,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 320,
            height: 660,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            inset: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: BG }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 8px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ORANGE, fontSize: 17, fontWeight: 800 }}>H</span>
          <span style={{ color: INK, fontSize: 15, fontWeight: 700 }}>Henholib</span>
        </span>
        <span style={{ width: 26, height: 26, borderRadius: 999, background: CARD, display: "grid", placeItems: "center", fontSize: 11 }}>
          🔔
        </span>
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: "0 14px" }}>{children}</div>
    </div>
  );
}

function TabBar({ active }: { active: string }) {
  const tabs = [
    { id: "Home", glyph: "⌂" },
    { id: "Care", glyph: "🗓" },
    { id: "Wallet", glyph: "▭" },
    { id: "Health", glyph: "〜" },
    { id: "Profile", glyph: "○" },
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0 12px",
        background: CARD,
        borderTop: "1px solid #E6E8ED",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <span key={t.id} style={{ display: "grid", justifyItems: "center", gap: 2 }}>
            <span style={{ fontSize: 13, color: on ? ORANGE : MUTED }}>{t.glyph}</span>
            <span style={{ fontSize: 8, fontWeight: on ? 700 : 500, color: on ? ORANGE : MUTED }}>{t.id}</span>
          </span>
        );
      })}
    </div>
  );
}

function SosDot() {
  return (
    <span
      style={{
        position: "absolute",
        right: 14,
        bottom: 66,
        width: 48,
        height: 48,
        borderRadius: 999,
        background: RED,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 800,
        boxShadow: "0 8px 20px rgba(240,62,62,0.45)",
      }}
    >
      SOS
    </span>
  );
}

function Row({ icon, tint, title, sub, right }: { icon: string; tint: string; title: string; sub?: string; right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: tint, display: "grid", placeItems: "center", fontSize: 13 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: INK }}>{title}</span>
        {sub && <span style={{ display: "block", fontSize: 10, color: MUTED, lineHeight: 1.35 }}>{sub}</span>}
      </span>
      <span style={{ fontSize: 10, color: MUTED }}>{right ?? "›"}</span>
    </div>
  );
}

function HomeScreen() {
  return (
    <Chrome>
      <div style={{ background: ORANGE, borderRadius: 16, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ width: 54, height: 54, borderRadius: 12, background: "rgba(255,255,255,0.28)" }} />
          <span style={{ width: 50, height: 50, borderRadius: 6, background: "#fff", display: "grid", placeItems: "center", fontSize: 26 }}>▦</span>
        </div>
        <p style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: "10px 0 2px" }}>Sule Best</p>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 9, fontFamily: "monospace" }}>
          HL-ED5Y-7J6V-67 · Verified
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
          {[["Genotype", "AA"], ["Allergies", "0"], ["Conditions", "0"]].map(([k, v]) => (
            <span key={k} style={{ fontSize: 9, color: "rgba(255,255,255,0.85)" }}>
              {k} <strong style={{ color: "#fff" }}>{v}</strong>
            </span>
          ))}
        </div>
      </div>

      <div style={{ background: CARD, borderRadius: 12, padding: 11, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Today's health</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#12A150", background: "#E7F7EE", padding: "3px 7px", borderRadius: 999 }}>All good</span>
        </div>
        <p style={{ fontSize: 10, color: MUTED, marginTop: 5 }}>Nothing scheduled today.</p>
      </div>

      <div style={{ display: "flex", gap: 7 }}>
        {[["🗓", "Book"], ["📎", "Prescriptions"], ["▭", "Pay bill"]].map(([g, l]) => (
          <span key={l} style={{ flex: 1, background: CARD, borderRadius: 12, padding: "12px 5px", display: "grid", justifyItems: "center", gap: 5 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "#FDEBE0", display: "grid", placeItems: "center", fontSize: 13 }}>{g}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: INK }}>{l}</span>
          </span>
        ))}
      </div>
      <SosDot />
    </Chrome>
  );
}

function CareScreen() {
  return (
    <Chrome>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>Care</span>
        <span style={{ background: ORANGE, color: "#fff", fontSize: 10, fontWeight: 700, padding: "7px 14px", borderRadius: 999 }}>+ Book</span>
      </div>
      <div style={{ background: CARD, borderRadius: 14, overflow: "hidden" }}>
        <Row icon="◎" tint="#E3F5EA" title="Find a hospital" sub="Nearest first, or search by what you need treated." />
        <Row icon="✚" tint="#E8F1FE" title="Book a consultation" sub="Pick a doctor, pick a time, done." />
        <Row icon="✔" tint="#FDF1DC" title="Reviews & complaints" sub="Rate your visits, or file a complaint that gets routed automatically." />
        <Row icon="🕐" tint="#FDF1DC" title="Specialist waitlist" sub="Fully booked? Get first refusal when a slot frees up." />
      </div>
      <p style={{ fontSize: 17, fontWeight: 800, color: INK, margin: "14px 0 8px" }}>Upcoming</p>
      <div style={{ background: CARD, borderRadius: 14, height: 70 }} />
      <SosDot />
    </Chrome>
  );
}

function WalletScreen() {
  return (
    <Chrome>
      <p style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 10 }}>Wallet</p>
      <div style={{ background: "linear-gradient(120deg,#17181C,#3A2418)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>HEALTH WALLET</p>
        <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "4px 0 10px" }}>₦0</p>
        <span style={{ background: "#fff", color: INK, fontSize: 10, fontWeight: 700, padding: "7px 14px", borderRadius: 999 }}>+ Add money</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 7 }}>To pay</p>
      <div style={{ background: CARD, borderRadius: 14, padding: "26px 12px", display: "grid", justifyItems: "center", gap: 5 }}>
        <span style={{ width: 34, height: 34, borderRadius: 999, background: "#EDEFF4", display: "grid", placeItems: "center", fontSize: 14, color: MUTED }}>✓</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Nothing to pay</span>
        <span style={{ fontSize: 9, color: MUTED, textAlign: "center" }}>Hospital bills appear here for one tap payment.</span>
      </div>
      <SosDot />
    </Chrome>
  );
}

function HealthScreen() {
  return (
    <Chrome>
      <p style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 9 }}>Health</p>
      <div style={{ display: "flex", background: "#E4E7EE", borderRadius: 11, padding: 3, marginBottom: 10 }}>
        <span style={{ flex: 1, background: CARD, borderRadius: 9, padding: "7px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: INK }}>Records</span>
        <span style={{ flex: 1, padding: "7px 0", textAlign: "center", fontSize: 11, color: MUTED }}>Medications</span>
      </div>
      <div style={{ background: CARD, borderRadius: 14, padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: `conic-gradient(${ORANGE} 0turn ${57 / 100}turn, #E4E7EE ${57 / 100}turn 1turn)`,
            }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 999, background: CARD, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: INK }}>57</span>
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: INK }}>Health engagement</span>
            <span style={{ display: "block", fontSize: 9, color: MUTED }}>Appointments 20/30 · meds 20/30</span>
          </span>
        </div>
        <p style={{ background: "#EDEFF4", borderRadius: 9, padding: 8, fontSize: 9.5, color: INK, marginTop: 9, lineHeight: 1.4 }}>
          It has been a while since your last visit. Book a routine check up.
        </p>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {["All", "Visits", "Labs", "Imaging"].map((c, i) => (
          <span key={c} style={{ background: i === 0 ? INK : CARD, color: i === 0 ? "#fff" : MUTED, fontSize: 9.5, fontWeight: 600, padding: "6px 11px", borderRadius: 999 }}>
            {c}
          </span>
        ))}
      </div>
      <SosDot />
    </Chrome>
  );
}

function SosScreen() {
  return (
    <Chrome>
      <p style={{ fontSize: 24, fontWeight: 800, color: RED, marginBottom: 2 }}>Emergency SOS</p>
      <p style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.45, marginBottom: 12 }}>
        We share your location with responders and alert the nearest Henholib hospital.
      </p>
      {[
        ["♥", "Medical", "Ambulance / nearest hospital"],
        ["🛡", "Police", "Nearest police station"],
        ["⚠", "Fire", "Nearest fire service"],
      ].map(([g, t, s]) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 11, background: "#FDE7E7", borderRadius: 14, padding: 12, marginBottom: 9 }}>
          <span style={{ width: 38, height: 38, borderRadius: 999, background: RED, color: "#fff", display: "grid", placeItems: "center", fontSize: 15 }}>{g}</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: RED }}>{t}</span>
            <span style={{ display: "block", fontSize: 10, color: "#C74141" }}>{s}</span>
          </span>
          <span style={{ color: RED, fontSize: 13 }}>›</span>
        </div>
      ))}
    </Chrome>
  );
}

const RENDER: Record<Screen, () => JSX.Element> = {
  Home: HomeScreen,
  Care: CareScreen,
  Wallet: WalletScreen,
  Health: HealthScreen,
  SOS: SosScreen,
};

const TAB_FOR: Record<Screen, string> = {
  Home: "Home",
  Care: "Care",
  Wallet: "Wallet",
  Health: "Health",
  SOS: "Home",
};

export function HenholibShowcase({ scale = 1 }: { scale?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % SCREENS.length), 3400);
    return () => clearInterval(id);
  }, [paused]);

  const screen = SCREENS[i];
  const Body = RENDER[screen];

  return (
    <div
      ref={hostRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ display: "grid", justifyItems: "center", gap: 14 }}
    >
      <Phone scale={scale}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div key={screen} style={{ flex: 1, minHeight: 0, animation: "hl-screen-in 420ms ease" }}>
            <Body />
          </div>
          <TabBar active={TAB_FOR[screen]} />
        </div>
      </Phone>

      {/* Tapping a dot is faster than waiting for the loop to come round. */}
      <div style={{ display: "flex", gap: 6 }}>
        {SCREENS.map((s, idx) => (
          <button
            key={s}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show ${s}`}
            style={{
              width: idx === i ? 20 : 7,
              height: 7,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: idx === i ? ORANGE : "rgba(15,23,41,0.18)",
              transition: "width 260ms ease, background 260ms ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes hl-screen-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="hl-screen-in"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
