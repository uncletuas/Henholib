import { useEffect, useState } from "react";
import { X, CreditCard, LogOut, ChevronRight, ArrowUpRight, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { accountApi, launchProductApp, type Subscription, type Invoice, type AccountProductId, type AuthUser, type PalPlan } from "../lib/api";
import { accountProducts, productById } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";
import { PalPlansModal } from "./PalPlansModal";

interface AccountDashboardProps {
  user: { name: string; email: string };
  onClose: () => void;
  onSignOut: () => void;
}

type Tab = "overview" | "billing" | "settings";

const statusMeta: Record<Subscription["status"], { label: string; color: string }> = {
  active: { label: "Active", color: "#10B981" },
  trialing: { label: "Trial", color: "#0EA5E9" },
  past_due: { label: "Past due", color: "#F59E0B" },
  canceled: { label: "Canceled", color: "#9CA3AF" },
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Shared profile avatar — the photo the user set on Loopital, or their initial. */
function AccountAvatar({ url, name, size = 48, radius = 16 }: { url?: string | null; name: string; size?: number; radius?: number }) {
  if (url) {
    return <img src={url} alt={name} className="object-cover flex-shrink-0" style={{ width: size, height: size, borderRadius: radius, border: `1px solid ${colors.hairline}` }} />;
  }
  return (
    <div className="flex items-center justify-center text-white font-bold flex-shrink-0" style={{ width: size, height: size, borderRadius: radius, background: gradientBrand, fontSize: size * 0.4 }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

export function AccountDashboard({ user, onClose, onSignOut }: AccountDashboardProps) {
  const { token, user: authUser, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let active = true;
    Promise.all([accountApi.getSubscriptions(token), accountApi.getInvoices(token)])
      .then(([s, inv]) => { if (!active) return; setSubs(s.subscriptions); setInvoices(inv.invoices); })
      .catch(() => { /* keep empty state if the portal API is unavailable */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const subFor = (id: AccountProductId) => subs.find((s) => s.product === id);
  const [showPlans, setShowPlans] = useState(false);
  const palPlan = (subFor("stack62")?.plan as PalPlan | undefined);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(10,10,15,0.45)", backdropFilter: "blur(16px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl rounded-[28px] flex flex-col" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: "0 40px 110px rgba(0,0,0,0.2)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-6" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          <AccountAvatar url={authUser?.avatarUrl} name={user.name} />
          <div className="flex-1 min-w-0">
            <p style={{ color: colors.heading, fontSize: "16px", fontWeight: 600 }}>{user.name}</p>
            <p style={{ color: colors.textTertiary, fontSize: "13px" }}>{authUser?.headline || user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F5F5F7] transition-colors" style={{ color: colors.textTertiary }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 gap-6" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          {(["overview", "billing", "settings"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className="py-4 capitalize transition-all" style={{ color: tab === t ? colors.heading : colors.textTertiary, fontSize: "14px", fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? `2px solid ${colors.blue}` : "2px solid transparent" }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {tab === "overview" && (
            <div className="flex flex-col gap-7">
              <div>
                <p style={{ color: colors.textTertiary, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>YOUR PRODUCTS</p>
                {loading ? (
                  <div className="flex items-center justify-center py-10" style={{ color: colors.textTertiary }}><Loader2 size={20} className="animate-spin" /></div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {accountProducts.map((p) => {
                      const sub = subFor(p.id as AccountProductId);
                      const st = sub ? statusMeta[sub.status] : null;
                      return (
                        <div key={p.id} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
                            <ImageWithFallback src={p.logo} alt={p.name} className="w-9 h-9 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span style={{ fontWeight: 600, color: colors.heading, fontSize: "15px" }}>{p.name}</span>
                              {sub && <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: `${p.accent}14`, color: p.accent }}>{sub.plan}</span>}
                            </div>
                            <p style={{ color: colors.textTertiary, fontSize: "13px", marginTop: "2px" }}>
                              {sub ? `AI coworker active, renews ${fmtDate(sub.currentPeriodEnd)}` : "Workspace included free · AI coworker not added"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {st && <span className="hidden sm:flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} /><span style={{ color: colors.textSecondary, fontSize: "12px" }}>{st.label}</span></span>}
                            <button onClick={() => p.appHref && launchProductApp(p.appHref, p.id as AccountProductId, token)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors hover:bg-[#F5F5F7]" style={{ border: `1px solid ${colors.hairline}`, color: colors.heading }}>
                              Open workspace <ArrowUpRight size={12} />
                            </button>
                            {p.id === "stack62" && (
                              <button onClick={() => setShowPlans(true)} className="px-3.5 py-2 rounded-full text-xs font-semibold text-white transition-all hover:opacity-95" style={{ background: gradientBrand }}>
                                {sub ? "Change plan" : "Add coworker"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Enterprise products are demo-led, not account-managed */}
              <div className="p-5 rounded-2xl" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}>
                <p style={{ fontWeight: 600, fontSize: "14px", color: colors.heading, marginBottom: "4px" }}>Looking for HMS7 or FMS13?</p>
                <p style={{ color: colors.textSecondary, fontSize: "13px", lineHeight: 1.6 }}>
                  Our enterprise platforms are set up with your team directly.{" "}
                  <a href="/contact" onClick={onClose} style={{ color: colors.blue, fontWeight: 500 }}>Book a demo →</a>
                </p>
              </div>

              <div className="p-5 rounded-2xl" style={{ background: "#EEF4FF", border: "1px solid #C7D9FF" }}>
                <p style={{ fontWeight: 600, fontSize: "14px", color: "#1D4ED8", marginBottom: "4px" }}>One account, every app</p>
                <p style={{ color: "#2563EB", fontSize: "13px", lineHeight: 1.65 }}>Sign in to Swift or Pal with this same email and password, your subscription activates automatically.</p>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div className="flex flex-col gap-8">
              <div>
                <p style={{ color: colors.textTertiary, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>PAYMENT METHOD</p>
                <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded-lg flex items-center justify-center bg-white" style={{ border: `1px solid ${colors.hairline}` }}><CreditCard size={16} style={{ color: colors.blue }} /></div>
                    <div><p style={{ color: colors.heading, fontSize: "14px", fontWeight: 500 }}>Visa ending in 4242</p><p style={{ color: colors.textTertiary, fontSize: "12px" }}>Expires 12/28</p></div>
                  </div>
                  <button className="flex items-center gap-1 text-sm" style={{ color: colors.blue }}>Update <ChevronRight size={14} /></button>
                </div>
              </div>
              <div>
                <p style={{ color: colors.textTertiary, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>INVOICE HISTORY</p>
                {loading ? (
                  <div className="flex items-center justify-center py-10" style={{ color: colors.textTertiary }}><Loader2 size={20} className="animate-spin" /></div>
                ) : invoices.length === 0 ? (
                  <p style={{ color: colors.textTertiary, fontSize: "14px" }}>No invoices yet.</p>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${colors.hairline}` }}>
                    {invoices.map((inv, i) => {
                      const p = productById(inv.product);
                      return (
                        <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F5F7] transition-colors" style={{ background: colors.surface, borderBottom: i < invoices.length - 1 ? `1px solid ${colors.hairline}` : "none" }}>
                          <div>
                            <div className="flex items-center gap-2"><p style={{ color: colors.heading, fontSize: "14px", fontWeight: 500 }}>{p.name}</p><p style={{ color: colors.textTertiary, fontSize: "12px" }}>· {inv.id}</p></div>
                            <p style={{ color: colors.textTertiary, fontSize: "12px" }}>{fmtDate(inv.issuedAt)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span style={{ color: colors.heading, fontSize: "14px", fontWeight: 500 }}>{inv.amount}</span>
                            <span className="px-2 py-0.5 rounded-md text-xs capitalize" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>{inv.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <ProfileSettings
              email={user.email}
              current={authUser}
              token={token}
              onSaved={updateUser}
              onSignOut={onSignOut}
            />
          )}
        </div>
      </div>
      {showPlans && <PalPlansModal token={token} currentPlan={palPlan ?? "free"} onClose={() => setShowPlans(false)} />}
    </div>
  );
}

/** The shared-profile editor (name, photo, headline) — one identity everywhere. */
function ProfileSettings({ email, current, token, onSaved, onSignOut }: {
  email: string;
  current: AuthUser | null;
  token: string | null;
  onSaved: (user: AuthUser) => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(current?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(current?.avatarUrl ?? "");
  const [headline, setHeadline] = useState(current?.headline ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inputStyle = { background: colors.bg, border: "1px solid rgba(0,0,0,0.10)", color: colors.heading, fontSize: "15px" } as const;

  const save = async () => {
    if (!token) return;
    setBusy(true); setMsg(null);
    try {
      const r = await accountApi.updateProfile(token, { name: name.trim(), avatarUrl: avatarUrl.trim(), headline: headline.trim() });
      onSaved(r.user);
      setMsg({ ok: true, text: "Saved — this updates your profile across Loopital, Pal and Swift." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save your profile." });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 rounded-2xl" style={{ background: "#EEF4FF", border: "1px solid #C7D9FF" }}>
        <p style={{ fontWeight: 600, fontSize: "13.5px", color: "#1D4ED8", marginBottom: "2px" }}>Your profile, everywhere</p>
        <p style={{ color: "#2563EB", fontSize: "12.5px", lineHeight: 1.6 }}>This is the name and photo people see across Loopital, Pal and Swift, one account, one identity.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <AccountAvatar url={avatarUrl || null} name={name} size={64} radius={20} />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Profile photo URL</label>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…/your-photo.jpg" className="w-full px-4 py-2.5 rounded-2xl outline-none" style={inputStyle} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-2">
        <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Headline <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Founder at Acme · Growth marketer" className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-2">
        <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Email address</label>
        <input type="email" value={email} disabled className="w-full px-4 py-3 rounded-2xl outline-none" style={{ ...inputStyle, opacity: 0.65 }} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="self-start px-6 py-2.5 rounded-full font-semibold text-sm text-white hover:opacity-95 disabled:opacity-60 inline-flex items-center gap-2" style={{ background: gradientBrand }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : null} Save changes
        </button>
        {msg && <span style={{ color: msg.ok ? "#10B981" : "#DC2626", fontSize: "12.5px" }}>{msg.text}</span>}
      </div>

      <div style={{ borderTop: `1px solid ${colors.hairline}`, paddingTop: "24px" }}>
        <button onClick={onSignOut} className="flex items-center gap-2 transition-colors text-sm" style={{ color: colors.textTertiary }}><LogOut size={15} />Sign out of all devices</button>
      </div>
    </div>
  );
}
