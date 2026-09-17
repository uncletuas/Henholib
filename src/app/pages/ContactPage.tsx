import { useState } from "react";
import { colors } from "../lib/brand";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { contactApi } from "../lib/api";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await contactApi.send({ ...form, subject: form.subject || "General" });
      setSent(true);
    } catch {
      setError("Couldn't send right now. Please email us at info@loopital.com.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 0,
    border: "1px solid rgba(0,0,0,0.1)",
    background: colors.surfaceMuted,
    color: colors.heading,
    fontSize: "15px",
    outline: "none",
  };

  const contactInfo = [
    { label: "Email", value: "info@loopital.com", href: "mailto:info@loopital.com" },
    { label: "Phone", value: "+234 705 939 9170", href: "tel:+2347059399170" },
  ];

  return (
    <div>
      {/* Header */}
      <section style={{ background: colors.surfaceMuted, padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              Let's talk.
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8 }}>
              Whether you have a question about Loopital, want to bring your hospital on board, or are exploring a partnership, we're ready to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section style={{ background: colors.surface, padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Left info */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              {/* Contact details */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
                <h2 style={{ fontWeight: 700, fontSize: "20px", color: colors.heading }}>Get in touch</h2>
                {contactInfo.map((c) => (
                  <div key={c.label}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textTertiary, letterSpacing: "0.06em", marginBottom: "4px" }}>{c.label.toUpperCase()}</p>
                    <a href={c.href} className="transition-colors hover:text-[#2563EB]" style={{ fontSize: "16px", color: colors.heading, fontWeight: 500 }}>
                      {c.value}
                    </a>
                  </div>
                ))}
              </motion.div>

              {/* Inquiry types */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-4">
                <h2 style={{ fontWeight: 700, fontSize: "20px", color: colors.heading }}>What we help with</h2>
                {[
                  { tag: "Hospitals & partners", desc: "Bringing your hospital, pharmacy, lab or HMO onto Loopital" },
                  { tag: "Partnership opportunities", desc: "Business partnerships, reseller arrangements, and integrations" },
                  { tag: "Support", desc: "Help with your Loopital account or your facility's workspace" },
                ].map(item => (
                  <div key={item.tag} className="flex flex-col gap-1 p-4 " style={{ background: colors.surfaceMuted, border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p style={{ fontWeight: 600, fontSize: "14px", color: colors.blue }}>{item.tag}</p>
                    <p style={{ fontSize: "13px", color: colors.textSecondary }}>{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: form + map */}
            <div className="lg:col-span-3 flex flex-col gap-8">
              {/* Contact form */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="p-8 " style={{ background: colors.surfaceMuted, border: "1px solid rgba(0,0,0,0.07)" }}>
                  {sent ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: "20px", color: colors.heading }}>Message sent</h3>
                      <p style={{ color: colors.textSecondary, fontSize: "15px" }}>We'll get back to you within one business day.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <h2 style={{ fontWeight: 700, fontSize: "20px", color: colors.heading, marginBottom: "4px" }}>Send us a message</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label style={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>Full name</label>
                          <input type="text" required placeholder="Jane Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = colors.blue; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label style={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>Email address</label>
                          <input type="email" required placeholder="jane@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = colors.blue; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label style={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>Subject</label>
                        <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                          <option value="">Select a topic…</option>
                          <option>Product inquiry</option>
                          <option>Partnership opportunity</option>
                          <option>Support request</option>
                          <option>Careers</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label style={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>Message</label>
                        <textarea required rows={5} placeholder="Tell us more about what you need…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = colors.blue; }} onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                      </div>
                      {error && <p style={{ color: "#DC2626", fontSize: "13px" }}>{error}</p>}
                      <button type="submit" disabled={loading} className="py-3.5  font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center" style={{ background: colors.blue, color: "#fff" }}>
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send message"}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
