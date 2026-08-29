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


// Repo-managed, so it ships inside dist/ and a deploy cannot delete it.
const MEDIA_SRC = "/media/mission-bg.jpg";

export function CommitmentSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: colors.ink }}>
      <img
        src={MEDIA_SRC}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.55 }}
      />

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
        <Reveal className="max-w-3xl">          <h2 style={{ color: "#FFFFFF", fontSize: "clamp(32px,4.4vw,50px)", lineHeight: 1.12, marginBottom: "20px" }}>
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
