import { useEffect, useRef } from "react";

const LAVENDER = "#a78bfa";
const MINT = "#86efac";

// Bold arrow cursor path (viewBox 0 0 14 21)
const ARROW = "M 0 0 L 0 16.5 L 4 12.5 L 6.5 18.5 L 9 17.5 L 6.5 11.5 L 11.5 11.5 Z";

// Pointing hand cursor path (viewBox 0 0 20 24)
// Index finger + palm / fist shape
const HAND = `
  M 6 0 L 6 11
  L 3.5 11 L 3.5 13.5
  L 1.5 13.5 L 1.5 16
  L 1.5 19 C 1.5 21.5 3.5 23.5 6 23.5
  L 13 23.5 C 15.5 23.5 17.5 21.5 17.5 19
  L 17.5 13 C 17.5 11 15.5 10 13.5 10.5
  L 11 10.5 L 11 0 Z
`;

export function CustomCursor() {
  const cursorRef    = useRef<HTMLDivElement>(null);
  const arrowSvgRef  = useRef<SVGSVGElement>(null);
  const handSvgRef   = useRef<SVGSVGElement>(null);
  const glowRef      = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const isPointer    = useRef(false);
  const rafId        = useRef<number>(0);
  const mx           = useRef(-300);
  const my           = useRef(-300);
  const particleTs   = useRef(0);
  const particleN    = useRef(0);

  useEffect(() => {
    const el       = cursorRef.current!;
    const arrowSvg = arrowSvgRef.current!;
    const handSvg  = handSvgRef.current!;
    const glow     = glowRef.current!;
    const pBox     = particlesRef.current!;

    /* ── Direct-DOM cursor loop ──────────────────────────── */
    function tick() {
      el.style.transform = `translate(${mx.current}px,${my.current}px)`;
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    /* ── Particle factory ────────────────────────────────── */
    function spawnParticle(x: number, y: number) {
      const now = performance.now();
      if (now - particleTs.current < 40) return;  // 25/s max
      if (particleN.current >= 12) return;
      particleTs.current = now;
      particleN.current++;

      const size  = Math.random() * 3 + 1.2;
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * 10 + 2;
      const px    = x + Math.cos(angle) * dist - size / 2;
      const py    = y + Math.sin(angle) * dist - size / 2;

      const p = document.createElement("div");
      p.style.cssText = `
        position:fixed;left:${px}px;top:${py}px;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${LAVENDER};
        box-shadow:0 0 ${size * 2.5}px ${LAVENDER}90;
        pointer-events:none;opacity:.65;
        transition:opacity .38s ease-out,transform .38s ease-out;
        will-change:opacity,transform;
      `;
      pBox.appendChild(p);

      requestAnimationFrame(() => {
        p.style.opacity = "0";
        p.style.transform = `scale(.2) translate(${(Math.random()-0.5)*8}px,${(Math.random()-0.5)*8}px)`;
      });

      setTimeout(() => {
        p.remove();
        particleN.current = Math.max(0, particleN.current - 1);
      }, 420);
    }

    /* ── Hover detection ─────────────────────────────────── */
    const POINTER_SELECTOR =
      'button,a,[role="button"],[tabindex]:not([tabindex="-1"]),input,select,textarea,label,summary';

    function setPointer(on: boolean) {
      if (on === isPointer.current) return;
      isPointer.current = on;

      if (on) {
        arrowSvg.style.opacity = "0";
        handSvg.style.opacity  = "1";
        glow.style.width       = "90px";
        glow.style.height      = "90px";
        glow.style.opacity     = "1";
        glow.style.background  = `radial-gradient(circle,rgba(134,239,172,.30) 0%,transparent 68%)`;
      } else {
        arrowSvg.style.opacity = "1";
        handSvg.style.opacity  = "0";
        glow.style.width       = "48px";
        glow.style.height      = "48px";
        glow.style.opacity     = ".55";
        glow.style.background  = `radial-gradient(circle,rgba(167,139,250,.18) 0%,transparent 68%)`;
      }
    }

    /* ── mousemove ───────────────────────────────────────── */
    function onMove(e: MouseEvent) {
      mx.current = e.clientX;
      my.current = e.clientY;

      // particle trail only in default state
      if (!isPointer.current) spawnParticle(e.clientX, e.clientY);

      // hit-test for pointer state
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      setPointer(!!(hit?.closest(POINTER_SELECTOR)));
    }

    function onLeave() {
      mx.current = -300;
      my.current = -300;
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/* Particle container */}
      <div
        ref={particlesRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99990 }}
      />

      {/* Cursor wrapper — anchored at (0,0), translated by JS */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
          transform: "translate(-300px,-300px)",
        }}
      >
        {/* Ambient glow halo */}
        <div
          ref={glowRef}
          style={{
            position: "absolute",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: `radial-gradient(circle,rgba(167,139,250,.18) 0%,transparent 68%)`,
            transform: "translate(-50%,-50%)",
            left: "6px",
            top: "6px",
            opacity: 0.55,
            transition: "width .25s ease, height .25s ease, opacity .25s ease, background .25s ease",
            pointerEvents: "none",
          }}
        />

        {/* ── Arrow cursor (default) ─────────────────────── */}
        <svg
          ref={arrowSvgRef}
          viewBox="0 0 14 21"
          width="22"
          height="33"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            overflow: "visible",
            opacity: 1,
            transition: "opacity .18s ease",
          }}
        >
          {/* Dark offset outline */}
          <path
            d={ARROW}
            fill="rgba(12,6,28,.85)"
            transform="translate(1.5,1.5)"
          />
          {/* Lavender fill */}
          <path
            d={ARROW}
            fill={LAVENDER}
            style={{
              filter: `drop-shadow(0 0 3px ${LAVENDER}) drop-shadow(0 0 7px ${LAVENDER}80)`,
            }}
          />
        </svg>

        {/* ── Hand / pointer cursor (hover) ─────────────── */}
        <svg
          ref={handSvgRef}
          viewBox="0 0 20 25"
          width="24"
          height="31"
          style={{
            position: "absolute",
            left: "-4px",
            top: "-1px",
            overflow: "visible",
            opacity: 0,
            transition: "opacity .18s ease",
          }}
        >
          {/* Dark offset outline */}
          <path
            d={HAND}
            fill="rgba(12,6,28,.85)"
            transform="translate(1.5,1.5)"
          />
          {/* Mint fill */}
          <path
            d={HAND}
            fill={MINT}
            style={{
              filter: `drop-shadow(0 0 4px ${MINT}) drop-shadow(0 0 10px ${MINT}70)`,
            }}
          />
        </svg>
      </div>
    </>
  );
}
