import { useState } from "react";
import { X, Download, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";

interface AccountDashboardProps {
  user: { name: string; email: string };
  onClose: () => void;
  onSignOut: () => void;
}

type Tab = "overview" | "billing" | "settings";

const myApps = [
  { name: "FMS13", logo: fms13Logo, plan: "Multi-Site", price: "$99/mo", nextBilling: "Jul 1, 2026", accent: "#D97706", status: "active" },
  { name: "HMS7", logo: hms7Logo, plan: "Clinic", price: "$69/mo", nextBilling: "Jul 5, 2026", accent: "#059669", status: "active" },
];

const invoices = [
  { id: "INV-2026-046", date: "Jun 1, 2026", app: "FMS13", amount: "$99.00" },
  { id: "INV-2026-045", date: "Jun 5, 2026", app: "HMS7", amount: "$69.00" },
  { id: "INV-2026-044", date: "May 1, 2026", app: "FMS13", amount: "$99.00" },
  { id: "INV-2026-043", date: "May 5, 2026", app: "HMS7", amount: "$69.00" },
];

export function AccountDashboard({ user, onClose, onSignOut }: AccountDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(13,13,26,0.45)", backdropFilter: "blur(16px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl rounded-2xl flex flex-col bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 32px 100px rgba(0,0,0,0.18)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: "#4F46E5" }}>{user.name[0].toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p style={{ color: "#0D0D1A", fontSize: "16px", fontWeight: 600 }}>{user.name}</p>
            <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: "#9CA3AF" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 gap-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          {(["overview", "billing", "settings"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className="py-4 capitalize transition-all" style={{ color: tab === t ? "#4F46E5" : "#9CA3AF", fontSize: "14px", fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "2px solid #4F46E5" : "2px solid transparent" }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {tab === "overview" && (
            <div className="flex flex-col gap-7">
              <div>
                <p style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>YOUR SUBSCRIPTIONS</p>
                <div className="flex flex-col gap-3">
                  {myApps.map(app => (
                    <div key={app.name} className="flex items-center gap-4 p-5 rounded-xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white flex-shrink-0" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                        <ImageWithFallback src={app.logo} alt={app.name} className="w-9 h-9 object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span style={{ fontWeight: 600, color: "#0D0D1A", fontSize: "15px" }}>{app.name}</span><span className="px-2 py-0.5 rounded text-xs" style={{ background: `${app.accent}12`, color: app.accent }}>{app.plan}</span></div>
                        <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "2px" }}>{app.price} · Renews {app.nextBilling}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span style={{ color: "#6B7280", fontSize: "12px" }}>Active</span></div>
                        <button className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white transition-colors" style={{ border: "1px solid rgba(0,0,0,0.09)", color: "#374151" }}><Download size={12} />Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <p style={{ fontWeight: 600, fontSize: "14px", color: "#3730A3", marginBottom: "4px" }}>Activating inside the app</p>
                <p style={{ color: "#4338CA", fontSize: "13px", lineHeight: 1.65 }}>Open any Loopital app and sign in with your email and password. Your subscription activates automatically — no codes needed.</p>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div className="flex flex-col gap-8">
              <div>
                <p style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>PAYMENT METHOD</p>
                <div className="flex items-center justify-between p-5 rounded-xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded-lg flex items-center justify-center bg-white" style={{ border: "1px solid rgba(0,0,0,0.1)" }}><CreditCard size={16} style={{ color: "#4F46E5" }} /></div>
                    <div><p style={{ color: "#0D0D1A", fontSize: "14px", fontWeight: 500 }}>Visa ending in 4242</p><p style={{ color: "#9CA3AF", fontSize: "12px" }}>Expires 12/28</p></div>
                  </div>
                  <button className="flex items-center gap-1 text-sm hover:text-[#3730A3] transition-colors" style={{ color: "#4F46E5" }}>Update <ChevronRight size={14} /></button>
                </div>
              </div>
              <div>
                <p style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>INVOICE HISTORY</p>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  {invoices.map((inv, i) => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors bg-white" style={{ borderBottom: i < invoices.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <div><div className="flex items-center gap-2"><p style={{ color: "#0D0D1A", fontSize: "14px", fontWeight: 500 }}>{inv.app}</p><p style={{ color: "#9CA3AF", fontSize: "12px" }}>· {inv.id}</p></div><p style={{ color: "#9CA3AF", fontSize: "12px" }}>{inv.date}</p></div>
                      <div className="flex items-center gap-4"><span style={{ color: "#0D0D1A", fontSize: "14px", fontWeight: 500 }}>{inv.amount}</span><span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>Paid</span><button className="text-sm hover:text-[#4F46E5] transition-colors" style={{ color: "#9CA3AF" }}>PDF</button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="flex flex-col gap-6">
              {[{ label: "Full name", val: user.name, type: "text" }, { label: "Email address", val: user.email, type: "email" }].map(f => (
                <div key={f.label} className="flex flex-col gap-2">
                  <label style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}>{f.label}</label>
                  <input type={f.type} defaultValue={f.val} className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.10)", color: "#0D0D1A", fontSize: "15px" }} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#4F46E5"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.10)"; }} />
                </div>
              ))}
              <button className="self-start px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90" style={{ background: "#4F46E5", color: "#fff" }}>Save changes</button>
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "24px" }}>
                <button onClick={onSignOut} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm"><LogOut size={15} />Sign out of all devices</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
