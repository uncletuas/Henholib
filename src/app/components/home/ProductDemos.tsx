import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { colors, tint } from "../../lib/brand";

/**
 * The product screens shown inside the home-page cards.
 *
 * These are miniatures of the real interface — a sidebar, a toolbar, a table
 * with rows and status pills — not abstract charts. That distinction is the
 * whole point: an animated bar tells a visitor nothing about what the software
 * looks like to use, whereas a scaled-down version of the actual screen tells
 * them immediately whether it is for them.
 *
 * They are built rather than screenshotted because every product screen worth
 * showing sits behind a login, and a screenshot of a sign-in form is not a demo.
 * Built markup also stays sharp at any size, follows the site's own tokens, and
 * can never leak a real customer's record onto a marketing page.
 *
 * Motion is deliberately small: a caret typing, a row highlighting, a counter
 * ticking. Enough to read as live, not so much that six of them on one page
 * becomes a fairground.
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
const ui = 'ui-sans-serif, system-ui, "Segoe UI", sans-serif';

// ── Shared app chrome ──────────────────────────────────────────────────────

/**
 * The frame every screen sits in: a title bar with window dots, an optional
 * sidebar, and the content area. Shared so the six demos read as one product
 * family rather than six unrelated drawings.
 */
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
        borderRadius: "10px",
        fontFamily: ui,
      }}
    >
      <div
        className="flex items-center gap-2 px-2.5 shrink-0"
        style={{ height: 26, background: colors.surfaceMuted, borderBottom: `1px solid ${colors.hairline}` }}
      >
        <span className="flex gap-1">
          {["#F0625B", "#F5BE4F", "#5FC456"].map((c) => (
            <span key={c} className="rounded-full" style={{ width: 6, height: 6, background: c }} />
          ))}
        </span>
        <span style={{ fontSize: "9px", color: colors.textTertiary, fontWeight: 500 }}>{title}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {sidebar && (
          <div
            className="shrink-0 py-2 px-1.5 flex flex-col gap-0.5"
            style={{ width: 74, background: colors.surfaceRaised, borderRight: `1px solid ${colors.hairline}` }}
          >
            {sidebar.map((item) => (
              <span
                key={item.label}
                className="px-1.5 py-1 rounded"
                style={{
                  fontSize: "8.5px",
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

/** A status pill — the most recognisable element of a real admin screen. */
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5"
      style={{
        background: tint(color, 0.14),
        color,
        fontSize: "8px",
        fontWeight: 700,
        lineHeight: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/**
 * A phone chassis, for the products that are phone apps.
 *
 * Swift and Henholib are mobile applications, and drawing them inside a desktop
 * window with a sidebar would misrepresent them — a visitor would expect a web
 * app and find an app store. The frame is the honest part of the demo.
 */
function Phone({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="overflow-hidden flex flex-col"
        style={{
          width: 120,
          height: "100%",
          maxHeight: 182,
          background: colors.surface,
          border: `1px solid ${colors.hairlineStrong}`,
          borderRadius: 15,
          fontFamily: ui,
          boxShadow: "0 6px 18px rgba(15,23,41,0.10)",
        }}
      >
        {/* Status bar + notch, the two marks that read instantly as "phone". */}
        <div
          className="shrink-0 flex items-center justify-between px-2"
          style={{ height: 15, background: tint(accent, 0.1) }}
        >
          <span style={{ fontSize: "6.5px", color: colors.textTertiary, fontWeight: 600 }}>9:41</span>
          <span style={{ width: 22, height: 3, borderRadius: 2, background: colors.hairlineStrong }} />
          <span style={{ fontSize: "6.5px", color: colors.textTertiary }}>▮</span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

// ── Pal — document editor with the coworker panel ──────────────────────────

const PAL_ACCENT = "#6D5AF0";

export function PalDemo() {
  const { ref, step } = useSteps(40, 110);
  const draft =
    "Q3 grew 18% on flat headcount. The constraint is hiring, not demand — three roles open since June.";
  const typed = draft.slice(0, Math.min(draft.length, step * 4));

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={PAL_ACCENT}
        title="Pal — Board memo"
        sidebar={[{ label: "Docs", active: true }, { label: "Sheets" }, { label: "Files" }, { label: "Tasks" }]}
      >
        <div className="flex h-full">
          <div className="flex-1 p-2.5 min-w-0">
            <div style={{ height: 5, width: "52%", background: colors.heading, borderRadius: 2, opacity: 0.85 }} />
            <p style={{ fontSize: "9px", lineHeight: 1.55, color: colors.text, marginTop: 7 }}>
              {typed}
              {typed.length < draft.length && (
                <span style={{ background: PAL_ACCENT, width: 1, display: "inline-block", height: 8 }} />
              )}
            </p>
            <div className="flex flex-col gap-1" style={{ marginTop: 8 }}>
              {[92, 78, 85].map((w, i) => (
                <span key={i} style={{ height: 3, width: `${w}%`, background: colors.surfaceMuted, borderRadius: 2 }} />
              ))}
            </div>
          </div>

          {/* The coworker panel — what makes this Pal rather than any editor. */}
          <div
            className="shrink-0 p-2 flex flex-col gap-1.5"
            style={{ width: 96, borderLeft: `1px solid ${colors.hairline}`, background: tint(PAL_ACCENT, 0.05) }}
          >
            <span style={{ fontSize: "8px", fontWeight: 700, color: PAL_ACCENT, letterSpacing: "0.06em" }}>
              COWORKER
            </span>
            <div className="rounded px-1.5 py-1" style={{ background: colors.surface, border: `1px solid ${colors.hairline}` }}>
              <p style={{ fontSize: "8px", color: colors.textSecondary, lineHeight: 1.4 }}>Summarise the board pack</p>
            </div>
            <div className="rounded px-1.5 py-1" style={{ background: PAL_ACCENT }}>
              <p style={{ fontSize: "8px", color: "#fff", lineHeight: 1.4 }}>Drafted. Leads with hiring.</p>
            </div>
          </div>
        </div>
      </Screen>
    </div>
  );
}

// ── Swift — the phone app ─────────────────────────────────────────────────

const SWIFT_ACCENT = "#0EA5E9";
const SWIFT_CHANNELS = [
  { name: "Meta", spend: "₦84k", state: "Live", color: "#10B981" },
  { name: "Google", spend: "₦61k", state: "Review", color: "#F59E0B" },
];

export function SwiftDemo() {
  const { ref, step } = useSteps(24, 130);
  const leads = 1180 + step * 3;

  return (
    <div ref={ref} className="h-full">
      <Phone accent={SWIFT_ACCENT}>
        <div className="px-2 pt-1.5 pb-2 flex flex-col gap-1.5 flex-1">
          <div className="rounded-lg px-2 py-1.5" style={{ background: tint(SWIFT_ACCENT, 0.1) }}>
            <p style={{ fontSize: "6.5px", color: SWIFT_ACCENT, fontWeight: 700, letterSpacing: "0.05em" }}>
              LEADS
            </p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: colors.heading, fontFamily: mono, lineHeight: 1.1 }}>
              {leads.toLocaleString()}
            </p>
            <p style={{ fontSize: "6.5px", color: colors.textSecondary }}>₦154 per lead</p>
          </div>

          {SWIFT_CHANNELS.map((c) => (
            <div key={c.name} className="flex items-center gap-1">
              <span style={{ fontSize: "7.5px", color: colors.text, width: 30 }}>{c.name}</span>
              <span style={{ fontSize: "7px", color: colors.textTertiary, fontFamily: mono }}>{c.spend}</span>
              <span className="ml-auto">
                <Pill text={c.state} color={c.color} />
              </span>
            </div>
          ))}

          {/* A tab bar is the single clearest signal that this is an app. */}
          <div
            className="flex gap-1 mt-auto pt-1"
            style={{ borderTop: `1px solid ${colors.hairline}` }}
          >
            {["Ads", "Leads", "Inbox"].map((t, i) => (
              <span
                key={t}
                className="flex-1 text-center rounded"
                style={{
                  fontSize: "6.5px",
                  fontWeight: 600,
                  padding: "2.5px 0",
                  background: i === 0 ? SWIFT_ACCENT : "transparent",
                  color: i === 0 ? "#fff" : colors.textTertiary,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Phone>
    </div>
  );
}

// ── Modus — work orders ────────────────────────────────────────────────────

const MODUS_ACCENT = "#0891B2";
const ORDERS = [
  { id: "WO-4821", asset: "Chiller 02", state: "Open", color: "#F59E0B" },
  { id: "WO-4820", asset: "Generator A", state: "Done", color: "#10B981" },
  { id: "WO-4818", asset: "Pump 3", state: "Urgent", color: "#E11D48" },
  { id: "WO-4815", asset: "Lift West", state: "Open", color: "#F59E0B" },
];

export function ModusDemo() {
  const { ref, step } = useSteps(ORDERS.length * 3, 900);
  const active = step % ORDERS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={MODUS_ACCENT}
        title="Modus — Work orders"
        sidebar={[{ label: "Orders", active: true }, { label: "Assets" }, { label: "Vendors" }, { label: "Sites" }]}
      >
        <div className="h-full flex flex-col">
          <div
            className="flex items-center gap-1.5 px-2 shrink-0"
            style={{ height: 18, background: colors.surfaceRaised, borderBottom: `1px solid ${colors.hairline}` }}
          >
            <span style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.05em" }}>ID</span>
            <span style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.05em" }}>ASSET</span>
            <span className="ml-auto" style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.05em" }}>STATUS</span>
          </div>
          {ORDERS.map((o, i) => (
            <div
              key={o.id}
              className="flex items-center gap-1.5 px-2"
              style={{
                height: 26,
                background: i === active ? tint(MODUS_ACCENT, 0.08) : "transparent",
                borderBottom: `1px solid ${colors.hairline}`,
                transition: "background .4s ease",
              }}
            >
              <span style={{ fontSize: "8px", color: colors.textTertiary, fontFamily: mono }}>{o.id}</span>
              <span style={{ fontSize: "9px", color: colors.text, fontWeight: 500 }}>{o.asset}</span>
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

// ── Beacon — gradebook ─────────────────────────────────────────────────────

const BEACON_ACCENT = "#D6294E";
const STUDENTS = [
  { name: "Adaeze O.", ca: 27, exam: 57 },
  { name: "Ibrahim K.", ca: 22, exam: 49 },
  { name: "Chinedu A.", ca: 29, exam: 63 },
  { name: "Fatima B.", ca: 19, exam: 47 },
];

export function BeaconDemo() {
  const { ref, step } = useSteps(STUDENTS.length * 3, 850);
  const active = step % STUDENTS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={BEACON_ACCENT}
        title="Beacon — SS2 Mathematics"
        sidebar={[{ label: "Results", active: true }, { label: "Students" }, { label: "Fees" }, { label: "Timetable" }]}
      >
        <div className="h-full flex flex-col">
          <div
            className="flex items-center px-2 shrink-0"
            style={{ height: 18, background: colors.surfaceRaised, borderBottom: `1px solid ${colors.hairline}` }}
          >
            <span style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, width: 58 }}>STUDENT</span>
            <span style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, width: 22 }}>CA</span>
            <span style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary, width: 28 }}>EXAM</span>
            <span className="ml-auto" style={{ fontSize: "7.5px", fontWeight: 700, color: colors.textTertiary }}>GRADE</span>
          </div>
          {STUDENTS.map((s, i) => {
            const total = s.ca + s.exam;
            const grade = total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
            const gc = total >= 70 ? "#10B981" : total >= 60 ? "#F59E0B" : "#E11D48";
            return (
              <div
                key={s.name}
                className="flex items-center px-2"
                style={{
                  height: 26,
                  background: i === active ? tint(BEACON_ACCENT, 0.07) : "transparent",
                  borderBottom: `1px solid ${colors.hairline}`,
                  transition: "background .4s ease",
                }}
              >
                <span style={{ fontSize: "9px", color: colors.text, width: 58 }}>{s.name}</span>
                <span style={{ fontSize: "8.5px", color: colors.textSecondary, fontFamily: mono, width: 22 }}>{s.ca}</span>
                <span style={{ fontSize: "8.5px", color: colors.textSecondary, fontFamily: mono, width: 28 }}>{s.exam}</span>
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

// ── Henholib — the phone app ───────────────────────────────────────────────

const HEN_ACCENT = "#F97316";

export function HenholibDemo() {
  const { ref, step } = useSteps(20, 700);
  const pulse = 70 + (step % 4);

  return (
    <div ref={ref} className="h-full">
      <Phone accent={HEN_ACCENT}>
        <div className="px-2 pt-1.5 pb-2 flex flex-col gap-1.5 flex-1">
          <p style={{ fontSize: "8px", color: colors.textTertiary }}>Good morning, Mia</p>

          <div className="rounded-lg px-2 py-1.5" style={{ background: tint(HEN_ACCENT, 0.1) }}>
            <p style={{ fontSize: "6.5px", color: HEN_ACCENT, fontWeight: 700, letterSpacing: "0.05em" }}>
              NEXT APPOINTMENT
            </p>
            <p style={{ fontSize: "8px", color: colors.heading, fontWeight: 600, marginTop: 1 }}>
              Dr. Eze · Thu 10:30
            </p>
            <p style={{ fontSize: "6.5px", color: colors.textSecondary }}>Cardiology · UPTH</p>
          </div>

          <div
            className="rounded-lg px-2 py-1.5 flex items-center gap-1.5"
            style={{ border: `1px solid ${colors.hairline}` }}
          >
            <span style={{ fontSize: "13px", color: colors.heading, fontWeight: 700, fontFamily: mono }}>
              {pulse}
            </span>
            <span style={{ fontSize: "6.5px", color: colors.textTertiary, lineHeight: 1.2 }}>
              bpm
              <br />
              resting
            </span>
          </div>

          <div className="flex gap-1 mt-auto pt-1" style={{ borderTop: `1px solid ${colors.hairline}` }}>
            {["Records", "Book", "Chat"].map((t, i) => (
              <span
                key={t}
                className="flex-1 text-center rounded"
                style={{
                  fontSize: "6.5px",
                  fontWeight: 600,
                  padding: "2.5px 0",
                  background: i === 0 ? HEN_ACCENT : "transparent",
                  color: i === 0 ? "#fff" : colors.textTertiary,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Phone>
    </div>
  );
}

// ── HMS7 — ward board ──────────────────────────────────────────────────────

const HMS_ACCENT = "#0D9F79";
const WARDS = [
  { ward: "Emergency", used: 11, total: 12 },
  { ward: "Maternity", used: 7, total: 14 },
  { ward: "Paediatrics", used: 5, total: 10 },
];

export function Hms7Demo() {
  const { ref, step } = useSteps(WARDS.length * 3, 950);
  const active = step % WARDS.length;

  return (
    <div ref={ref} className="h-full">
      <Screen
        accent={HMS_ACCENT}
        title="HMS7 — Ward board"
        sidebar={[{ label: "Wards", active: true }, { label: "Patients" }, { label: "Pharmacy" }, { label: "Billing" }]}
      >
        <div className="p-2.5 flex flex-col gap-2 h-full justify-center">
          {WARDS.map((w, i) => {
            const pct = (w.used / w.total) * 100;
            const tightNow = pct > 85;
            return (
              <div
                key={w.ward}
                className="rounded px-1.5 py-1"
                style={{
                  background: i === active ? tint(HMS_ACCENT, 0.07) : "transparent",
                  transition: "background .4s ease",
                }}
              >
                <div className="flex items-baseline justify-between" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: "9px", color: colors.text, fontWeight: 500 }}>{w.ward}</span>
                  <span
                    style={{
                      fontSize: "8px",
                      fontFamily: mono,
                      color: tightNow ? "#E11D48" : colors.textTertiary,
                      fontWeight: tightNow ? 700 : 400,
                    }}
                  >
                    {w.used}/{w.total}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: w.total }).map((_, b) => (
                    <span
                      key={b}
                      className="flex-1 rounded-sm"
                      style={{
                        height: 7,
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
