import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { colors, tint } from "../../lib/brand";

/**
 * Miniatures of the real product screens, drawn from the shipped apps.
 *
 * Two chassis, chosen to match what each product actually is: a phone for
 * Henholib, a desktop window for HMS7 (and for Modus and Beacon, whose demos
 * are kept here for the products page). Drawing a mobile
 * product inside browser chrome promises a web app that does not exist, and the
 * reverse makes an operations console look like something you'd install.
 *
 * **Everything is written at natural size and scaled down.** A phone screen is
 * laid out at a real 320px width and then transformed to fit its card, rather
 * than authored directly at 7px type. That is what keeps the proportions
 * honest — padding, corner radii and type scale all stay in the ratios the real
 * app uses, instead of being guessed at thumbnail size.
 *
 * The data is invented. Nothing here should ever be mistaken for a real record.
 */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Loop a step counter, but only while the card is actually on screen. */
function useSteps(count: number, intervalMs: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setStep(count - 1);
      return;
    }
    if (!visible) return;
    const id = setInterval(() => setStep((s) => (s + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [visible, reduced, count, intervalMs]);

  return { ref, step };
}

const mono = 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace';
const ui = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif';

/** The natural width every phone screen is authored at, before scaling. */
const PHONE_W = 320;
const PHONE_H = 660;

/**
 * A phone, rendered by laying the screen out at real size and scaling it into
 * the card. `scale` is derived from the card's demo height so the device always
 * fills it without the caller doing arithmetic.
 */
function Phone({
  children,
  frame = "#1A1D24",
  height = 320,
}: {
  children: ReactNode;
  frame?: string;
  height?: number;
}) {
  const scale = height / PHONE_H;
  return (
    <div className="h-full flex items-center justify-center">
      <div
        style={{
          width: PHONE_W * scale + 8,
          height: height + 8,
          background: frame,
          borderRadius: 26 * scale + 8,
          padding: 4,
          boxShadow: "0 12px 30px rgba(15,23,41,0.18)",
        }}
      >
        <div
          style={{
            width: PHONE_W * scale,
            height,
            borderRadius: 26 * scale,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: PHONE_W,
              height: PHONE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              fontFamily: ui,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The desktop chassis: title bar, sidebar, content. */
function Screen({
  accent,
  title,
  sidebar,
  children,
}: {
  accent: string;
  title: string;
  sidebar?: { label: string; active?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.hairline}`,
        borderRadius: 12,
        fontFamily: ui,
        boxShadow: "0 10px 26px rgba(15,23,41,0.10)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-3 shrink-0"
        style={{ height: 32, background: colors.surfaceMuted, borderBottom: `1px solid ${colors.hairline}` }}
      >
        <span className="flex gap-1.5">
          {["#F0625B", "#F5BE4F", "#5FC456"].map((c) => (
            <span key={c} className="rounded-full" style={{ width: 8, height: 8, background: c }} />
          ))}
        </span>
        <span style={{ fontSize: 11, color: colors.textTertiary, fontWeight: 500 }}>{title}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {sidebar && (
          <div
            className="shrink-0 py-2.5 px-2 flex flex-col gap-1"
            style={{ width: 92, background: colors.surfaceRaised, borderRight: `1px solid ${colors.hairline}` }}
          >
            {sidebar.map((item) => (
              <span
                key={item.label}
                className="px-2 py-1.5 rounded-md"
                style={{
                  fontSize: 10.5,
                  fontWeight: item.active ? 600 : 500,
                  color: item.active ? accent : colors.textTertiary,
                  background: item.active ? tint(accent, 0.12) : "transparent",
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function Pill({ text, color, size = 10 }: { text: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{
        background: tint(color, 0.15),
        color,
        fontSize: size,
        fontWeight: 700,
        padding: `${size * 0.2}px ${size * 0.65}px`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/** The status bar every phone screen starts with. */
function StatusBar({ tone = "#0F1729" }: { tone?: string }) {
  return (
    <div className="flex items-center justify-between px-5" style={{ height: 30, color: tone }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>9:41</span>
      <span className="flex items-center gap-1" style={{ fontSize: 10 }}>
        <span>▮▮▮</span>
        <span style={{ fontWeight: 700 }}>▮</span>
      </span>
    </div>
  );
}

// ── Henholib — the mobile app ─────────────────────────────────────────────

const HEN_ORANGE = "#F26D21";

export function HenholibDemo({ height = 320 }: { height?: number } = {}) {
  const { ref, step } = useSteps(2, 3200);

  return (
    <div ref={ref} className="h-full">
      <Phone frame="#1B1410" height={height}>
        <div style={{ background: "#EEF0F5", height: "100%", display: "flex", flexDirection: "column" }}>
          <StatusBar />

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 pb-3">
            <span style={{ color: HEN_ORANGE, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>H</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: "#12161F" }}>Henholib</span>
            <span
              className="ml-auto inline-flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 999, background: "#fff", fontSize: 15 }}
            >
              🔔
            </span>
          </div>

          {/* The health ID card — the thing the whole product is built around */}
          <div
            className="mx-4 px-4 py-4"
            style={{ background: `linear-gradient(140deg,${HEN_ORANGE} 0%,#E85D14 100%)`, borderRadius: 20 }}
          >
            <div className="flex items-start justify-between">
              <span
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 15,
                  background: "linear-gradient(160deg,#F4D9C4,#C98F63)",
                  border: "2px solid rgba(255,255,255,0.5)",
                  display: "block",
                }}
              />
              {/* QR, drawn as a deterministic block pattern rather than an image */}
              <span
                className="grid"
                style={{
                  width: 62,
                  height: 62,
                  padding: 4,
                  background: "#fff",
                  borderRadius: 5,
                  gridTemplateColumns: "repeat(9,1fr)",
                  gap: 1,
                }}
              >
                {Array.from({ length: 81 }).map((_, i) => {
                  const r = Math.floor(i / 9);
                  const c = i % 9;
                  const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
                  const on = corner ? !(r === 1 && c === 1) && !(r === 1 && c === 7) && !(r === 7 && c === 1) : (i * 7) % 3 === 0;
                  return <span key={i} style={{ background: on ? "#0B0B0B" : "transparent" }} />;
                })}
              </span>
            </div>

            <p style={{ fontSize: 23, fontWeight: 700, color: "#fff", marginTop: 12, lineHeight: 1.15 }}>Sule Best</p>
            <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.92)", fontFamily: mono }}>HL-ED5Y-7J6V-67</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.24)", color: "#fff", fontSize: 10.5, fontWeight: 600 }}
              >
                ⊘ Verified
              </span>
            </div>

            <div
              className="flex items-center gap-4"
              style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.28)" }}
            >
              {[
                ["Blood", "O+"],
                ["Genotype", "AA"],
                ["Allergies", "0"],
              ].map(([k, v]) => (
                <span key={k} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
                  {k} <strong style={{ color: "#fff", fontWeight: 700 }}>{v}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Today's health */}
          <div className="mx-4 mt-3 px-4 py-3" style={{ background: "#fff", borderRadius: 15 }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#12161F" }}>Today's health</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: "#E7F7EE", color: "#12B76A", fontSize: 11.5, fontWeight: 600 }}
              >
                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#12B76A" }} /> All good
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#98A1AE", marginTop: 6 }}>
              {step === 0 ? "Nothing scheduled today. You're all caught up." : "Refill due Friday · Amlodipine 5mg"}
            </p>
          </div>

          {/* Quick actions */}
          <div className="mx-4 mt-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
            {[
              ["🗓", "Book"],
              ["📎", "Prescriptions"],
              ["▤", "Pay bill"],
            ].map(([icon, label]) => (
              <span
                key={label}
                className="flex flex-col items-center justify-center py-3"
                style={{ background: "#fff", borderRadius: 14 }}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 34, height: 34, borderRadius: 11, background: "#FDEBDF", fontSize: 15 }}
                >
                  {icon}
                </span>
                <span style={{ fontSize: 11, color: "#12161F", fontWeight: 600, marginTop: 6 }}>{label}</span>
              </span>
            ))}
          </div>

          {/* Wallet + SOS */}
          <div className="mx-4 mt-3 relative">
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#fff", borderRadius: 15 }}>
              <span
                className="inline-flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, borderRadius: 999, background: "#12161F", color: "#fff", fontSize: 14 }}
              >
                ▤
              </span>
              <span>
                <span style={{ display: "block", fontSize: 12.5, color: "#7A8492" }}>Wallet balance</span>
                <span style={{ fontSize: 19, fontWeight: 700, color: "#12161F" }}>₦0</span>
              </span>
            </div>
            <span
              className="absolute inline-flex items-center justify-center"
              style={{
                right: -2,
                top: -22,
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "#F0332F",
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                boxShadow: "0 6px 16px rgba(240,51,47,0.45)",
              }}
            >
              SOS
            </span>
          </div>

          {/* Tab bar */}
          <div
            className="flex items-center justify-between px-5 mt-auto shrink-0"
            style={{ height: 58, background: "#fff", borderTop: "1px solid #E4E8EF" }}
          >
            {["Home", "Care", "Wallet", "Health", "Profile"].map((t, i) => (
              <span key={t} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: 14, color: i === 0 ? HEN_ORANGE : "#98A1AE" }}>
                  {["⌂", "🗓", "▤", "⌇", "☺"][i]}
                </span>
                <span style={{ fontSize: 9.5, color: i === 0 ? HEN_ORANGE : "#98A1AE", fontWeight: i === 0 ? 700 : 500 }}>
                  {t}
                </span>
              </span>
            ))}
          </div>
        </div>
      </Phone>
    </div>
  );
}

// ── Modus — work orders ───────────────────────────────────────────────────

const MODUS_ACCENT = "#0891B2";
const ORDERS = [
  { id: "WO-4821", asset: "Chiller 02", site: "Tower A", state: "Open", color: "#F59E0B" },
  { id: "WO-4820", asset: "Generator A", site: "Plant", state: "Done", color: "#10B981" },
  { id: "WO-4818", asset: "Pump 3", site: "Basement", state: "Urgent", color: "#E11D48" },
  { id: "WO-4815", asset: "Lift West", site: "Tower B", state: "Open", color: "#F59E0B" },
  { id: "WO-4811", asset: "AHU 07", site: "Roof", state: "Done", color: "#10B981" },
];

export function ModusDemo() {
  const { ref, step } = useSteps(ORDERS.length * 3, 900);
  const active = step % ORDERS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={MODUS_ACCENT}
        title="Modus — Work orders"
        sidebar={[{ label: "Orders", active: true }, { label: "Assets" }, { label: "Vendors" }, { label: "Sites" }, { label: "Reports" }]}
      >
        <div className="h-full flex flex-col">
          <div
            className="flex items-center gap-3 px-3.5 shrink-0"
            style={{ height: 26, background: colors.surfaceRaised, borderBottom: `1px solid ${colors.hairline}` }}
          >
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.06em", width: 58 }}>ID</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.06em", width: 82 }}>ASSET</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.06em" }}>SITE</span>
            <span className="ml-auto" style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.06em" }}>STATUS</span>
          </div>
          {ORDERS.map((o, i) => (
            <div
              key={o.id}
              className="flex items-center gap-3 px-3.5"
              style={{
                flex: 1,
                background: i === active ? tint(MODUS_ACCENT, 0.08) : "transparent",
                borderBottom: `1px solid ${colors.hairline}`,
                transition: "background .4s ease",
              }}
            >
              <span style={{ fontSize: 10, color: colors.textTertiary, fontFamily: mono, width: 58 }}>{o.id}</span>
              <span style={{ fontSize: 11.5, color: colors.text, fontWeight: 500, width: 82 }}>{o.asset}</span>
              <span style={{ fontSize: 10.5, color: colors.textTertiary }}>{o.site}</span>
              <span className="ml-auto">
                <Pill text={o.state} color={o.color} />
              </span>
            </div>
          ))}
        </div>
      </Screen>
    </div>
  );
}

// ── Beacon — gradebook ────────────────────────────────────────────────────

const BEACON_ACCENT = "#D6294E";
const STUDENTS = [
  { name: "Adaeze Okoro", ca: 27, exam: 57 },
  { name: "Ibrahim Kabir", ca: 22, exam: 49 },
  { name: "Chinedu Anya", ca: 29, exam: 63 },
  { name: "Fatima Bello", ca: 19, exam: 47 },
  { name: "Tunde Alabi", ca: 25, exam: 54 },
];

export function BeaconDemo() {
  const { ref, step } = useSteps(STUDENTS.length * 3, 850);
  const active = step % STUDENTS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={BEACON_ACCENT}
        title="Beacon — SS2 Mathematics"
        sidebar={[{ label: "Results", active: true }, { label: "Students" }, { label: "Fees" }, { label: "Timetable" }, { label: "Staff" }]}
      >
        <div className="h-full flex flex-col">
          <div
            className="flex items-center px-3.5 shrink-0"
            style={{ height: 26, background: colors.surfaceRaised, borderBottom: `1px solid ${colors.hairline}` }}
          >
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, width: 104 }}>STUDENT</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, width: 34 }}>CA</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, width: 40 }}>EXAM</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary, width: 40 }}>TOTAL</span>
            <span className="ml-auto" style={{ fontSize: 9.5, fontWeight: 700, color: colors.textTertiary }}>GRADE</span>
          </div>
          {STUDENTS.map((s, i) => {
            const total = s.ca + s.exam;
            const grade = total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
            const gc = total >= 70 ? "#10B981" : total >= 60 ? "#F59E0B" : "#E11D48";
            return (
              <div
                key={s.name}
                className="flex items-center px-3.5"
                style={{
                  flex: 1,
                  background: i === active ? tint(BEACON_ACCENT, 0.07) : "transparent",
                  borderBottom: `1px solid ${colors.hairline}`,
                  transition: "background .4s ease",
                }}
              >
                <span style={{ fontSize: 11.5, color: colors.text, width: 104 }}>{s.name}</span>
                <span style={{ fontSize: 10.5, color: colors.textSecondary, fontFamily: mono, width: 34 }}>{s.ca}</span>
                <span style={{ fontSize: 10.5, color: colors.textSecondary, fontFamily: mono, width: 40 }}>{s.exam}</span>
                <span style={{ fontSize: 10.5, color: colors.heading, fontFamily: mono, fontWeight: 700, width: 40 }}>{total}</span>
                <span className="ml-auto">
                  <Pill text={grade} color={gc} />
                </span>
              </div>
            );
          })}
        </div>
      </Screen>
    </div>
  );
}

// ── HMS7 — ward board ─────────────────────────────────────────────────────

const HMS_ACCENT = "#0D9F79";
const WARDS = [
  { ward: "Emergency", used: 11, total: 12 },
  { ward: "Maternity", used: 7, total: 14 },
  { ward: "Paediatrics", used: 5, total: 10 },
  { ward: "Theatre", used: 3, total: 4 },
];

export function Hms7Demo() {
  const { ref, step } = useSteps(WARDS.length * 3, 950);
  const active = step % WARDS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={HMS_ACCENT}
        title="HMS7 — Ward board"
        sidebar={[{ label: "Wards", active: true }, { label: "Patients" }, { label: "Pharmacy" }, { label: "Billing" }, { label: "Lab" }]}
      >
        <div className="p-3.5 flex flex-col gap-3 h-full justify-center">
          {WARDS.map((w, i) => {
            const pct = (w.used / w.total) * 100;
            const tightNow = pct > 85;
            return (
              <div
                key={w.ward}
                className="rounded-lg px-2 py-1.5"
                style={{
                  background: i === active ? tint(HMS_ACCENT, 0.08) : "transparent",
                  transition: "background .4s ease",
                }}
              >
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: colors.text, fontWeight: 500 }}>{w.ward}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: mono,
                      color: tightNow ? "#E11D48" : colors.textTertiary,
                      fontWeight: tightNow ? 700 : 400,
                    }}
                  >
                    {w.used}/{w.total} beds
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: w.total }).map((_, b) => (
                    <span
                      key={b}
                      className="flex-1 rounded-sm"
                      style={{
                        height: 9,
                        background: b < w.used ? (tightNow ? "#E11D48" : HMS_ACCENT) : colors.surfaceMuted,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Screen>
    </div>
  );
}
