import { useState } from "react";
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
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.1)",
    background: "#F7F7FB",
    color: "#0D0D1A",
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
      <section style={{ background: "#F7F7FB", padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>CONTACT US</p>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              Let's talk.
            </h1>
            <p style={{ color: "#6B7280", fontSize: "18px", lineHeight: 1.8 }}>
              Whether you have a question about our products, want to discuss a project, or are exploring a partnership, we're ready to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section style={{ background: "#FFFFFF", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Left info */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              {/* Contact details */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
                <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A" }}>Get in touch</h2>
                {contactInfo.map((c) => (
                  <div key={c.label}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: "4px" }}>{c.label.toUpperCase()}</p>
                    <a href={c.href} className="transition-colors hover:text-[#2563EB]" style={{ fontSize: "16px", color: "#0D0D1A", fontWeight: 500 }}>
                      {c.value}
                    </a>
                  </div>
                ))}
              </motion.div>

              {/* Office */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-3">
                <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A" }}>Our office</h2>
                <div className="flex flex-col gap-1.5" style={{ paddingLeft: "16px", borderLeft: "3px solid #2563EB" }}>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "#0D0D1A" }}>Pyale Hub</p>
                  <p style={{ fontSize: "14px", color: "#6B7280" }}>21 Bekwere Wosu Street</p>
                  <p style={{ fontSize: "14px", color: "#6B7280" }}>D-Line, Diobu</p>
                  <p style={{ fontSize: "14px", color: "#6B7280" }}>Port Harcourt, Rivers State</p>
                  <p style={{ fontSize: "14px", color: "#6B7280" }}>Nigeria</p>
                </div>
              </motion.div>

              {/* Inquiry types */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-4">
                <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A" }}>What we help with</h2>
                {[
                  { tag: "Product inquiries", desc: "Questions about Pal, Swift, HMS7, or FMS13" },
                  { tag: "Partnership opportunities", desc: "Business partnerships, reseller arrangements, and integrations" },
                  { tag: "Services & projects", desc: "Web, mobile, AI, or enterprise development projects" },
                  { tag: "Support", desc: "Technical support for existing products or accounts" },
                ].map(item => (
                  <div key={item.tag} className="flex flex-col gap-1 p-4 rounded-xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p style={{ fontWeight: 600, fontSize: "14px", color: "#2563EB" }}>{item.tag}</p>
                    <p style={{ fontSize: "13px", color: "#6B7280" }}>{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: form + map */}
            <div className="lg:col-span-3 flex flex-col gap-8">
              {/* Contact form */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="p-8 rounded-2xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.07)" }}>
                  {sent ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A" }}>Message sent</h3>
                      <p style={{ color: "#6B7280", fontSize: "15px" }}>We'll get back to you within one business day.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A", marginBottom: "4px" }}>Send us a message</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Full name</label>
                          <input type="text" required placeholder="Jane Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563EB"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Email address</label>
                          <input type="email" required placeholder="jane@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563EB"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Subject</label>
                        <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                          <option value="">Select a topic…</option>
                          <option>Product inquiry</option>
                          <option>Partnership opportunity</option>
                          <option>Services / project</option>
                          <option>Support request</option>
                          <option>Careers</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Message</label>
                        <textarea required rows={5} placeholder="Tell us more about what you need…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = "#2563EB"; }} onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,0,0,0.1)"; }} />
                      </div>
                      {error && <p style={{ color: "#DC2626", fontSize: "13px" }}>{error}</p>}
                      <button type="submit" disabled={loading} className="py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center" style={{ background: "#2563EB", color: "#fff" }}>
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send message"}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>

              {/* Map embed */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="rounded-2xl overflow-hidden" style={{ height: "320px", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <iframe
                    title="Loopital Office Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    loading="lazy"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.4823!2d7.0164!3d4.7815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwNDYnNTMuNCJOIDfCsDAwJzU5LjAiRQ!5e0!3m2!1sen!2sng!4v1680000000000!5m2!1sen!2sng"
                  />
                </div>
                <p className="mt-2 text-center" style={{ color: "#9CA3AF", fontSize: "12px" }}>
                  Pyale Hub · 21 Bekwere Wosu Street, D-Line, Port Harcourt, Nigeria
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
