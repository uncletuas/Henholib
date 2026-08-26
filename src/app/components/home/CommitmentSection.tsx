import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
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


// Repo-managed, so it ships inside dist/ and a deploy cannot delete it. Drop
// the file at public/media/commitment.mp4 (see the README there).
const VIDEO_SRC = "/media/commitment.mp4";

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
        poster="/media/commitment-poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: ready ? 0.72 : 0.4, transition: "opacity 1.2s ease" }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* The scrim is what makes the type legible regardless of the frame
          underneath. contrast can't depend on which moment the loop is at. */}
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
OUR MISSION
          </p>
          <h2 style={{ color: "#FFFFFF", fontSize: "clamp(32px,4.4vw,50px)", lineHeight: 1.12, marginBottom: "20px" }}>
            We are using technology to solve Africa's most important problems.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.84)", fontSize: "17.5px", lineHeight: 1.7, maxWidth: "620px" }}>
            We are pushing the boundaries of what it means to digitise operations
            and a nation. Built in Africa, for anywhere the same problems exist.
          </p>
          <p style={{ color: "#7FD8C0", fontSize: "17.5px", fontWeight: 600, lineHeight: 1.7, maxWidth: "620px", marginTop: "14px" }}>
            We are making the world a better place.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: "#FFFFFF", color: colors.onLight, fontSize: "14.5px", marginTop: "clamp(30px,3.5vw,44px)" }}
          >
            How we build <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
