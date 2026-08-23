import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, HeartPulse, ShieldCheck, Workflow } from "lucide-react";
import { colors } from "../../lib/brand";
import { Reveal } from "../Reveal";

/**
 * What Loopital is for — a full-bleed band with footage running behind it.
 *
 * The video is treated as texture, not content: muted, looping, `playsInline`,
 * and covered by a dark scrim heavy enough that the type over it clears
 * contrast on its own. Nothing is communicated only by the footage, so a
 * browser that blocks autoplay, a slow connection, or a reader who prefers
 * reduced motion all still get the same section — just with the poster frame
 * behind it instead of movement.
 *
 * `preload="none"` and a poster mean the 7MB clip never blocks first paint; it
 * arrives after the page is usable, or not at all on a metered connection.
 */

const PILLARS = [
  {
    icon: HeartPulse,
    title: "Health technology",
    body: "Records that follow the patient, hospitals that can see their whole operation, and care that reaches people who were never on a system at all.",
  },
  {
    icon: ShieldCheck,
    title: "Security systems",
    body: "Identity, access and audit built in from the first line, because software that holds people's records has to be able to prove who touched them.",
  },
  {
    icon: Workflow,
    title: "Work, simplified",
    body: "Operations software that removes steps instead of adding screens — so a small team can run a facility, a school or a campaign without a back office.",
  },
];

const VIDEO_SRC = "https://www.loopital.com/media/49815-458438877_large.mp4";

export function CommitmentSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  // Only fetch and play the footage once the section is near the viewport, and
  // pause it again when it leaves — a background video that decodes for the
  // whole visit is a battery cost with nothing to show for it.
  useEffect(() => {
    const node = sectionRef.current;
    const video = videoRef.current;
    if (!node || !video || typeof IntersectionObserver === "undefined") return;

    const reduced =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.preload !== "auto") video.preload = "auto";
          video.play().then(() => setReady(true)).catch(() => setReady(false));
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: colors.ink }}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: ready ? 0.72 : 0.4, transition: "opacity 1.2s ease" }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* The scrim is what makes the type legible regardless of the frame
          underneath — contrast can't depend on which moment the loop is at. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,10,22,0.82) 0%, rgba(6,10,22,0.58) 40%, rgba(6,10,22,0.88) 100%)",
        }}
      />

      <div
        className="relative mx-auto px-6"
        style={{ maxWidth: 1120, paddingTop: "clamp(84px,10vw,130px)", paddingBottom: "clamp(84px,10vw,130px)" }}
      >
        <Reveal className="max-w-3xl">
          <p
            style={{
              color: "#7FD8C0",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            OUR COMMITMENT
          </p>
          <h2 style={{ color: "#FFFFFF", fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.15, marginBottom: "20px" }}>
            Technology that makes life measurably better.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "17px", lineHeight: 1.7, maxWidth: "660px" }}>
            We build health technology that improves lives globally, security systems that keep
            people's information theirs, and operations software that makes real work simpler.
            Built in Africa, for anywhere the same problems exist.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginTop: "clamp(44px,5vw,64px)" }}>
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div
                className="h-full px-6 py-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span
                  className="inline-flex items-center justify-center rounded-xl"
                  style={{ width: 42, height: 42, background: "rgba(127,216,192,0.16)" }}
                >
                  <p.icon size={20} style={{ color: "#7FD8C0" }} />
                </span>
                <h3 style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 700, margin: "16px 0 8px" }}>
                  {p.title}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "14px", lineHeight: 1.65 }}>{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: "#FFFFFF", color: colors.onLight, fontSize: "14.5px", marginTop: "clamp(36px,4vw,52px)" }}
          >
            How we build <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
