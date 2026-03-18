import { useEffect, useRef } from "react";

const LAVENDER = "#a78bfa";

// Arrow cursor — rendered at 13×20px
const ARROW_PATH = "M 0 0 L 0 16.5 L 4 12.5 L 6.5 18.5 L 9 17.5 L 6.5 11.5 L 11.5 11.5 Z";
const ARROW_VIEWBOX = "0 0 14 21";

// Clean single pointing finger — rendered at 13×20px (same visual weight as arrow)
// Slim pill: rounded tip at top, tapering base
const FINGER_PATH = "M 1.5 6 C 1.5 1 8.5 1 8.5 6 L 8.5 14 C 8.5 16.5 7 18 5 18 C 3 18 1.5 16.5 1.5 14 Z";
const FINGER_VIEWBOX = "0 0 10 20";

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

    function tick() {
      el.style.transform = `translate(${mx.current}px,${my.current}px)`;
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    function spawnParticle(x: number, y: number) {
      const now = performance.now();
      if (now - particleTs.current < 40) return;
      if (particleN.current >= 10) return;
      particleTs.current = now;
      particleN.current++;

      const size  = Math.random() * 2 + 0.8;
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * 7 + 2;
      const px    = x + Math.cos(angle) * dist - size / 2;
      const py    = y + Math.sin(angle) * dist - size / 2;

      const p = document.createElement("div");
      p.style.cssText = `
        position:fixed;left:${px}px;top:${py}px;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${LAVENDER};
        box-shadow:0 0 ${size * 2}px ${LAVENDER}70;
        pointer-events:none;opacity:.45;
        transition:opacity .38s ease-out,transform .38s ease-out;
        will-change:opacity,transform;
      `;
      pBox.appendChild(p);
      requestAnimationFrame(() => {
        p.style.opacity = "0";
        p.style.transform = `scale(.1) translate(${(Math.random()-0.5)*6}px,${(Math.random()-0.5)*6}px)`;
      });
      setTimeout(() => {
        p.remove();
        particleN.current = Math.max(0, particleN.current - 1);
      }, 420);
    }

    const POINTER_SELECTOR =
      'button,a,[role="button"],[tabindex]:not([tabindex="-1"]),input,select,textarea,label,summary';

    function setPointer(on: boolean) {
      if (on === isPointer.current) return;
      isPointer.current = on;
      if (on) {
        arrowSvg.style.opacity  = "0";
        fingerSvg.style.opacity = "1";
        glow.style.width        = "44px";
        glow.style.height       = "44px";
        glow.style.opacity      = ".75";
      } else {
        arrowSvg.style.opacity  = "1";
        fingerSvg.style.opacity = "0";
        glow.style.width        = "28px";
        glow.style.height       = "28px";
        glow.style.opacity      = ".45";
      }
    }

    function onMove(e: MouseEvent) {
      mx.current = e.clientX;
      my.current = e.clientY;
      if (!isPointer.current) spawnParticle(e.clientX, e.clientY);
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      setPointer(!!(hit?.closest(POINTER_SELECTOR)));
    }

    function onLeave() { mx.current = -300; my.current = -300; }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const glowStyle: React.CSSProperties = {
    background: `radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 68%)`,
  };

  const shadowStyle = {
    filter: `drop-shadow(0 0 2.5px ${LAVENDER}) drop-shadow(0 0 6px ${LAVENDER}60)`,
  };

  return (
    <>
      <div ref={particlesRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:99990 }} />

      <div
        ref={cursorRef}
        style={{ position:"fixed", top:0, left:0, pointerEvents:"none", zIndex:99999, willChange:"transform", transform:"translate(-300px,-300px)" }}
      >
        {/* Ambient halo — always lavender */}
        <div
          ref={glowRef}
          style={{
            ...glowStyle,
            position: "absolute",
            width: "28px", height: "28px",
            borderRadius: "50%",
            transform: "translate(-50%,-50%)",
            left: "4px", top: "4px",
            opacity: 0.45,
            transition: "width .22s ease, height .22s ease, opacity .22s ease",
            pointerEvents: "none",
          }}
        />

        {/* Arrow (default) */}
        <svg
          ref={arrowSvgRef}
          viewBox={ARROW_VIEWBOX}
          width="13" height="20"
          style={{ position:"absolute", left:0, top:0, overflow:"visible", opacity:1, transition:"opacity .15s ease" }}
        >
          <path d={ARROW_PATH} fill="rgba(10,5,25,.80)" transform="translate(1,1)" />
          <path d={ARROW_PATH} fill={LAVENDER} style={shadowStyle} />
        </svg>

        {/* Finger (hover) — same lavender, same size */}
        <svg
          ref={fingerSvgRef}
          viewBox={FINGER_VIEWBOX}
          width="13" height="20"
          style={{ position:"absolute", left:"-1px", top:0, overflow:"visible", opacity:0, transition:"opacity .15s ease" }}
        >
          <path d={FINGER_PATH} fill="rgba(10,5,25,.80)" transform="translate(1,1)" />
          <path d={FINGER_PATH} fill={LAVENDER} style={shadowStyle} />
        </svg>
      </div>
    </>
  );
}
