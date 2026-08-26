import { useEffect, useState } from "react";

/**
 * Henholib, running.
 *
 * These are the real app screenshots, not a redrawing of them. An earlier
 * version rebuilt each screen in code, which drifted from the product in ways
 * that mattered; the founder supplied the exports, so the phone now shows
 * exactly what the app shows.
 *
 * The frame is sized from the image's own aspect ratio, so nothing is cropped
 * or stretched. Screens cycle on a timer, pause on hover, and stop entirely
 * under prefers-reduced-motion. The dots jump straight to a screen for anyone
 * who does not want to wait for the loop.
 *
 * All six are `loading="eager"` and preloaded on mount: this sits in the hero,
 * and a screen that arrives blank halfway through the rotation is worse than
 * the bytes it saves.
 */

const SHOTS = [
  { id: "home", label: "Home", src: "/media/henholib-home.jpg" },
  { id: "care", label: "Care", src: "/media/henholib-care.jpg" },
  { id: "health", label: "Health", src: "/media/henholib-health.jpg" },
  { id: "wallet", label: "Wallet", src: "/media/henholib-wallet.jpg" },
  { id: "profile", label: "Profile", src: "/media/henholib-profile.jpg" },
  { id: "sos", label: "Emergency SOS", src: "/media/henholib-sos.jpg" },
] as const;

/** The screenshots' natural size. Everything scales from this. */
const SHOT_W = 740;
const SHOT_H = 1280;

export function HenholibShowcase({ width = 300 }: { width?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // Warm every screen so a later slide never arrives blank.
  useEffect(() => {
    SHOTS.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, []);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % SHOTS.length), 3400);
    return () => clearInterval(id);
  }, [paused]);

  const screenH = Math.round((width * SHOT_H) / SHOT_W);
  const bezel = Math.round(width * 0.028);
  const radius = Math.round(width * 0.125);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ display: "grid", justifyItems: "center", gap: 16 }}
    >
      <div
        style={{
          width: width + bezel * 2,
          padding: bezel,
          borderRadius: radius + bezel,
          background: "linear-gradient(160deg,#2A2D34,#14161A)",
          boxShadow:
            "0 40px 90px rgba(15,23,41,0.30), 0 6px 18px rgba(15,23,41,0.14)",
        }}
      >
        <div
          style={{
            position: "relative",
            width,
            height: screenH,
            borderRadius: radius,
            overflow: "hidden",
            background: "#EEF0F5",
          }}
        >
          {SHOTS.map((s, idx) => (
            <img
              key={s.id}
              src={s.src}
              alt={`Henholib ${s.label} screen`}
              width={SHOT_W}
              height={SHOT_H}
              loading="eager"
              decoding="async"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: idx === i ? 1 : 0,
                transition: "opacity 520ms ease",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {SHOTS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show ${s.label}`}
            style={{
              width: idx === i ? 20 : 7,
              height: 7,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: idx === i ? "#F26D21" : "rgba(15,23,41,0.18)",
              transition: "width 260ms ease, background 260ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
