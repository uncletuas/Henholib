import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, FileHeart, ShieldCheck, Wallet } from "lucide-react";
import { colors } from "../../lib/brand";
import { HENHOLIB_URL } from "../../config/site";
import { Reveal } from "../Reveal";
import { HenholibDemo } from "./ProductDemos";

/**
 * The closing band: a direct pitch for Henholib.
 *
 * It replaced a generic "see what we can do" panel, which asked visitors to
 * imagine something instead of giving them one thing to do. Henholib is the
 * product a person arriving on loopital.com can actually start using today, so
 * it gets the last word.
 *
 * The palette is warm and low-saturation rather than the full brand gradient —
 * that gradient is loud enough to shout over the product screen sitting beside
 * it, and this section needs the phone to be the brightest thing in it.
 *
 * `MEDIA_SRC` takes footage when there is footage to take. Until then the
 * background is a warm wash and the phone carries the section, which is the
 * honest order of importance anyway: the product before the mood.
 */

const MEDIA_SRC: string | null = null;

const POINTS = [
  { icon: FileHeart, text: "Your records, in your hands. not in a folder behind a counter." },
  { icon: CalendarCheck, text: "Book consultations and see every visit, prescription and result." },
  { icon: ShieldCheck, text: "One verified health ID any hospital can check in seconds." },
  { icon: Wallet, text: "Pay bills and manage your HMO without the back-and-forth." },
];

export function HenholibCta() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!MEDIA_SRC) return;
    const node = sectionRef.current;
    const video = videoRef.current;
    if (!node || !video || typeof IntersectionObserver === "undefined") return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = "auto";
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
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
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF4EC 0%, #FDEDE1 45%, #F7E6F0 100%)" }}
    >
      {MEDIA_SRC && (
        <>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: playing ? 0.5 : 0.3, transition: "opacity 1.2s ease" }}
          >
            <source src={MEDIA_SRC} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{ background: "linear-gradient(160deg, rgba(255,244,236,0.9) 0%, rgba(253,237,225,0.82) 50%, rgba(247,230,240,0.92) 100%)" }}
          />
        </>
      )}

      {/* A warm bloom behind the phone, so the device reads as lit rather than
          pasted onto a flat panel. */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          right: "6%",
          top: "12%",
          width: "34vw",
          height: "34vw",
          background: "radial-gradient(circle at 50% 50%, rgba(242,109,33,0.20), transparent 68%)",
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative mx-auto px-6"
        style={{ maxWidth: 1040, paddingTop: "clamp(72px,9vw,110px)", paddingBottom: "clamp(72px,9vw,110px)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <p style={{ color: "#C2410C", fontSize: "13px", fontWeight: 700, letterSpacing: "0.09em", marginBottom: "14px" }}>
              HENHOLIB · FREE TO START
            </p>
            <h2 style={{ color: colors.heading, fontSize: "clamp(28px,3.6vw,42px)", lineHeight: 1.15, marginBottom: "16px" }}>
              Your medical records, finally in your hands.
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.7, marginBottom: "26px" }}>
              Every hospital visit, prescription and test result in one place you actually control. 
              with consultations, bills and your HMO handled from the same app.
            </p>

            <ul className="flex flex-col gap-3" style={{ marginBottom: "30px" }}>
              {POINTS.map((p) => (
                <li key={p.text} className="flex items-start gap-3">
                  <span
                    className="inline-flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 28, height: 28, background: "rgba(242,109,33,0.13)", marginTop: 1 }}
                  >
                    <p.icon size={15} style={{ color: "#F26D21" }} />
                  </span>
                  <span style={{ color: colors.text, fontSize: "14.5px", lineHeight: 1.55 }}>{p.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={HENHOLIB_URL}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: "#F26D21", color: "#FFFFFF", fontSize: "15px" }}
              >
                Get started with Henholib <ArrowRight size={16} />
              </a>
              <a
                href="/products/henholib"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold"
                style={{ color: colors.heading, fontSize: "14.5px", border: `1px solid ${colors.hairlineStrong}` }}
              >
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.12} from="right">
            <div className="flex justify-center lg:justify-end">
              <div style={{ width: 260 }}>
                <HenholibDemo height={420} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
