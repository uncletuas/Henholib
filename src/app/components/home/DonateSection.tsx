import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../Reveal";
import { colors, gradientBrand } from "../../lib/brand";
import { DONATE_URL } from "../../config/site";

/**
 * The fundraiser.
 *
 * Written from the campaign's own words rather than paraphrased into marketing
 * copy — the reason this works at all is that it is a specific thing that
 * happened to a specific person, and the founder already told it better than a
 * homepage section would.
 *
 * Two deliberate omissions. There is no raised-so-far or goal figure: the page
 * is static and the campaign is not, and a stale number on a donation ask reads
 * as neglect. And the campaign mentions blood type among the things a record
 * carries; the site does not talk about blood anywhere, so it says allergies
 * and conditions instead. Same point, and it keeps one rule in one place.
 */

// What the money does, condensed from the campaign's own three tiers.
const TIERS = [
  {
    when: "First",
    what: "Onboard the first hospitals and clinics properly, and start bringing pharmacies and laboratories into the same record.",
  },
  {
    when: "Then",
    what: "Expand city by city, and do the compliance and permit groundwork that handling people's health information responsibly requires.",
  },
  {
    when: "In full",
    what: "A genuinely wider network, and a fuller emergency directory so the SOS finds the nearest help in a small town as reliably as in Lagos.",
  },
];

export function DonateSection() {
  return (
    <section style={{ background: colors.bgSubtle, padding: "clamp(56px,6vw,88px) 24px" }}>
      <div className="mx-auto grid gap-10 lg:grid-cols-2 lg:items-center" style={{ maxWidth: 1100 }}>
        <Reveal>
          <img
            src="/media/care-ward.jpg"
            alt="A nurse attending to a child on a hospital ward"
            className="w-full"
            style={{ display: "block", objectFit: "cover", maxHeight: 420 }}
            loading="lazy"
          />
        </Reveal>

        <Reveal delay={0.1}>
          <h2 style={{ marginBottom: 18, letterSpacing: "-0.02em" }}>
            Help us bring one free health record to every Nigerian hospital.
          </h2>

          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.75, marginBottom: 14 }}>
            Our founder's mother was unconscious for four days. She was moved
            between three hospitals, and at every one they started from zero —
            new doctors, no records, nothing to say what had already been tried
            or ruled out. She survived. Plenty of families are not that lucky,
            and often not because there was no doctor, but because the doctor
            had nothing to work with.
          </p>

          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.75, marginBottom: 24 }}>
            That is why Henholib and HMS7 exist. One health ID that carries your
            history — your allergies, your conditions, what you were last given
            — to any hospital you reach. Both are built and tested. What we need
            now is the funding to put them into real hospitals, clinics,
            pharmacies and laboratories.
          </p>

          <ul className="flex flex-col gap-3" style={{ marginBottom: 28 }}>
            {TIERS.map((t) => (
              <li key={t.when} className="flex gap-3.5" style={{ fontSize: "15px", lineHeight: 1.65 }}>
                <span
                  style={{
                    color: colors.heading,
                    fontWeight: 700,
                    minWidth: 52,
                    flexShrink: 0,
                    fontSize: "13.5px",
                    letterSpacing: "0.04em",
                    paddingTop: 2,
                  }}
                >
                  {t.when.toUpperCase()}
                </span>
                <span style={{ color: colors.textSecondary }}>{t.what}</span>
              </li>
            ))}
          </ul>

          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
            style={{
              background: gradientBrand,
              color: "#FFFFFF",
              padding: "15px 28px",
              fontSize: "15.5px",
            }}
          >
            Donate on Crowdr <ArrowUpRight size={17} />
          </a>
          <p style={{ color: colors.textTertiary, fontSize: "13.5px", marginTop: 12 }}>
            Donations are handled by Crowdr, not by us. You will be taken to
            their site to give.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
