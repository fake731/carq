import { useEffect, useRef } from "react";

interface FloatingItem {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  rotSpeed: number;
  opacity: number;
  type: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<FloatingItem[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create floating items (garage tools & car parts)
    const count = Math.min(18, Math.floor(window.innerWidth / 80));
    itemsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.3,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      opacity: 0.04 + Math.random() * 0.06,
      type: Math.floor(Math.random() * 6),
    }));

    const drawWrench = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0);
      ctx.lineTo(s * 0.2, 0);
      ctx.lineWidth = s * 0.12;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.3, 0, s * 0.15, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.5, 0, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawGear = (ctx: CanvasRenderingContext2D, s: number) => {
      const teeth = 8;
      const inner = s * 0.25;
      const outer = s * 0.4;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
        const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
        const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.lineTo(Math.cos(a2) * outer, Math.sin(a2) * outer);
        ctx.lineTo(Math.cos(a3) * inner, Math.sin(a3) * inner);
        ctx.lineTo(Math.cos(a4) * inner, Math.sin(a4) * inner);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawBolt = (ctx: CanvasRenderingContext2D, s: number) => {
      const r = s * 0.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const drawCar = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.1);
      ctx.lineTo(-s * 0.3, -s * 0.1);
      ctx.lineTo(-s * 0.1, -s * 0.2);
      ctx.lineTo(s * 0.15, -s * 0.2);
      ctx.lineTo(s * 0.3, -s * 0.05);
      ctx.lineTo(s * 0.4, -s * 0.05);
      ctx.lineTo(s * 0.4, s * 0.1);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.2, s * 0.15, s * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.25, s * 0.15, s * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawScrewdriver = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo(0, s * 0.15);
      ctx.lineWidth = s * 0.08;
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-s * 0.06, s * 0.15, s * 0.12, s * 0.25, s * 0.03);
      ctx.stroke();
    };

    const drawPiston = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.beginPath();
      ctx.roundRect(-s * 0.15, -s * 0.3, s * 0.3, s * 0.35, s * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.05);
      ctx.lineTo(0, s * 0.3);
      ctx.lineWidth = s * 0.1;
      ctx.stroke();
    };

    const drawFns = [drawWrench, drawGear, drawBolt, drawCar, drawScrewdriver, drawPiston];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");
      const strokeColor = isDark ? "255,255,255" : "0,0,0";

      for (const item of itemsRef.current) {
        item.y -= item.speed;
        item.rotation += item.rotSpeed;
        if (item.y < -item.size * 2) {
          item.y = canvas.height + item.size * 2;
          item.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.strokeStyle = `rgba(${strokeColor},${item.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawFns[item.type](ctx, item.size);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
};

export default AnimatedBackground;
