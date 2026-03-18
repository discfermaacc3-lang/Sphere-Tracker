import { useEffect, useRef } from "react";

const LAVENDER = "#a78bfa";
// Muted mint — softer, less saturated
const MINT = "#7ecfa0";

// Arrow cursor path (viewBox 0 0 14 21) — original shape, rendered smaller
const ARROW = "M 0 0 L 0 16.5 L 4 12.5 L 6.5 18.5 L 9 17.5 L 6.5 11.5 L 11.5 11.5 Z";

// Clean single pointing-finger path (viewBox 0 0 10 19)
// Slim upward finger with rounded tip and slightly tapered base
const FINGER = `
  M 2.5 6.5
  C 2.5 1.5 7.5 1.5 7.5 6.5
  L 7.5 13.5
  C 7.5 15.5 5.5 16.5 5 16.5
  C 4.5 16.5 2.5 15.5 2.5 13.5
  Z
`;

export function CustomCursor() {
  const cursorRef    = useRef<HTMLDivElement>(null);
  const arrowSvgRef  = useRef<SVGSVGElement>(null);
  const fingerSvgRef = useRef<SVGSVGElement>(null);
  const glowRef      = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const isPointer    = useRef(false);
  const rafId        = useRef<number>(0);
  const mx           = useRef(-300);
  const my           = useRef(-300);
  const particleTs   = useRef(0);
  const particleN    = useRef(0);

  useEffect(() => {
    const el        = cursorRef.current!;
    const arrowSvg  = arrowSvgRef.current!;
    const fingerSvg = fingerSvgRef.current!;
    const glow      = glowRef.current!;
    const pBox      = particlesRef.current!;

    /* ── Direct-DOM cursor loop ──────────────────────────── */
    function tick() {
      el.style.transform = `translate(${mx.current}px,${my.current}px)`;
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    /* ── Particle factory ────────────────────────────────── */
    function spawnParticle(x: number, y: number) {
      const now = performance.now();
      if (now - particleTs.current < 40) return;
      if (particleN.current >= 10) return;
      particleTs.current = now;
      particleN.current++;

      const size  = Math.random() * 2.5 + 0.8;
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * 8 + 2;
      const px    = x + Math.cos(angle) * dist - size / 2;
      const py    = y + Math.sin(angle) * dist - size / 2;

      const p = document.createElement("div");
      p.style.cssText = `
        position:fixed;left:${px}px;top:${py}px;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${LAVENDER};
        box-shadow:0 0 ${size * 2}px ${LAVENDER}80;
        pointer-events:none;opacity:.5;
        transition:opacity .38s ease-out,transform .38s ease-out;
        will-change:opacity,transform;
      `;
      pBox.appendChild(p);

      requestAnimationFrame(() => {
        p.style.opacity = "0";
        p.style.transform = `scale(.15) translate(${(Math.random()-0.5)*6}px,${(Math.random()-0.5)*6}px)`;
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
        arrowSvg.style.opacity  = "0";
        fingerSvg.style.opacity = "1";
        glow.style.width        = "54px";
        glow.style.height       = "54px";
        glow.style.opacity      = "1";
        glow.style.background   = `radial-gradient(circle,rgba(126,207,160,.22) 0%,transparent 68%)`;
      } else {
        arrowSvg.style.opacity  = "1";
        fingerSvg.style.opacity = "0";
        glow.style.width        = "28px";
        glow.style.height       = "28px";
        glow.style.opacity      = ".50";
        glow.style.background   = `radial-gradient(circle,rgba(167,139,250,.18) 0%,transparent 68%)`;
      }
    }

    /* ── mousemove ───────────────────────────────────────── */
    function onMove(e: MouseEvent) {
      mx.current = e.clientX;
      my.current = e.clientY;

      if (!isPointer.current) spawnParticle(e.clientX, e.clientY);

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

      {/* Cursor wrapper */}
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
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: `radial-gradient(circle,rgba(167,139,250,.18) 0%,transparent 68%)`,
            transform: "translate(-50%,-50%)",
            left: "4px",
            top: "4px",
            opacity: 0.5,
            transition: "width .25s ease, height .25s ease, opacity .25s ease, background .25s ease",
            pointerEvents: "none",
          }}
        />

        {/* ── Arrow cursor (default) — 40% smaller ──────────── */}
        <svg
          ref={arrowSvgRef}
          viewBox="0 0 14 21"
          width="13"
          height="20"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            overflow: "visible",
            opacity: 1,
            transition: "opacity .18s ease",
          }}
        >
          <path
            d={ARROW}
            fill="rgba(12,6,28,.85)"
            transform="translate(1.2,1.2)"
          />
          <path
            d={ARROW}
            fill={LAVENDER}
            style={{
              filter: `drop-shadow(0 0 2px ${LAVENDER}) drop-shadow(0 0 5px ${LAVENDER}70)`,
            }}
          />
        </svg>

        {/* ── Clean finger cursor (hover) — 40% smaller ─────── */}
        <svg
          ref={fingerSvgRef}
          viewBox="0 0 10 19"
          width="14"
          height="19"
          style={{
            position: "absolute",
            left: "-3px",
            top: "-1px",
            overflow: "visible",
            opacity: 0,
            transition: "opacity .18s ease",
          }}
        >
          <path
            d={FINGER}
            fill="rgba(12,6,28,.80)"
            transform="translate(1,1)"
          />
          <path
            d={FINGER}
            fill={MINT}
            style={{
              filter: `drop-shadow(0 0 2px ${MINT}90) drop-shadow(0 0 5px ${MINT}50)`,
            }}
          />
        </svg>
      </div>
    </>
  );
}
