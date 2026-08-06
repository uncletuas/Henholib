import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Award, GraduationCap, ShieldCheck, Share2, Check } from "lucide-react";
import { Section } from "../../components/Section";
import { GradientText } from "../../components/GradientText";
import { CTAButton } from "../../components/CTAButton";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import { type PublicProfile, trackMeta } from "../../config/academy";

export function AchievementsPage() {
  const { username = "" } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStatus("loading");
    academyApi.achievements(username)
      .then((p) => { setProfile(p); setStatus("ready"); })
      .catch(() => setStatus("notfound"));
  }, [username]);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  };

  if (status === "loading") return <Section pad="lg" width="narrow"><p style={{ color: colors.textTertiary }}>Loading…</p></Section>;
  if (status === "notfound" || !profile) {
    return (
      <Section pad="lg" width="narrow" className="text-center">
        <h1 style={{ marginBottom: "12px" }}>Profile not found</h1>
        <p style={{ color: colors.textSecondary, marginBottom: "24px" }}>No public achievements page exists for “{username}”.</p>
        <CTAButton to="/academy" variant="gradient">Explore the Academy</CTAButton>
      </Section>
    );
  }

  const initials = profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Section pad="lg" width="narrow">
      {/* header */}
      <div className="flex items-center gap-5 mb-10 flex-wrap">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0" style={{ background: gradientBrand, color: "#fff", fontSize: "1.7rem", fontWeight: 800 }}>{initials}</div>
        <div className="flex-1 min-w-[200px]">
          <p style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "4px" }}>LOOPITAL ACADEMY · ACHIEVEMENTS</p>
          <h1 style={{ fontSize: "clamp(1.8rem,3.2vw,2.6rem)", marginBottom: "2px" }}>{profile.name}</h1>
          <p style={{ color: colors.textTertiary, fontSize: "14px" }}>@{profile.username}</p>
        </div>
        <button onClick={share} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold" style={{ background: colors.surfaceMuted, color: colors.heading, fontSize: "13.5px" }}>
          {copied ? <><Check size={15} style={{ color: colors.green }} /> Copied</> : <><Share2 size={15} /> Share</>}
        </button>
      </div>

      {profile.achievements.length === 0 ? (
        <div className="rounded-3xl p-10 text-center" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
          <GraduationCap size={30} style={{ color: colors.textTertiary, margin: "0 auto 12px" }} />
          <p style={{ color: colors.textSecondary }}>No completed courses yet, the journey is just beginning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile.achievements.map((a, i) => {
            const accent = trackMeta(a.track as "technical").accent;
            return (
              <div key={i} className="rounded-3xl p-6" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${accent}14`, color: accent }}>{trackMeta(a.track as "technical").name}</span>
                  {a.certificateSerial ? <Award size={18} style={{ color: colors.green }} /> : <GraduationCap size={18} style={{ color: colors.textTertiary }} />}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: colors.heading, marginBottom: "6px" }}>{a.courseTitle}</h3>
                <p style={{ fontSize: "13px", color: colors.textTertiary }}>
                  {a.certificateSerial ? "Certificate of Completion" : "Completed"}
                  {a.completedAt ? ` · ${new Date(a.completedAt).toLocaleDateString()}` : a.certificateIssuedAt ? ` · ${new Date(a.certificateIssuedAt).toLocaleDateString()}` : ""}
                </p>
                {a.certificateSerial && (
                  <Link to={`/verify?id=${encodeURIComponent(a.certificateSerial)}`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold" style={{ color: colors.blue }}>
                    <ShieldCheck size={14} /> Verify certificate
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 text-center">
        <span style={{ color: colors.textSecondary, fontSize: "14px" }}>Earn your own, </span>
        <Link to="/academy" style={{ color: colors.blue, fontSize: "14px", fontWeight: 600 }}>explore <GradientText>Loopital Academy</GradientText> →</Link>
      </div>
    </Section>
  );
}
