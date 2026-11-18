import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';

interface AdminAuthProps {
  onSuccess: (user: { id: string; email: string; username: string }) => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pts = Array.from({ length: 68 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: 0.7 + Math.random() * 1.1,
      alpha: 0.14 + Math.random() * 0.3,
      phase: i * 0.72,
    }));

    let time = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      for (const p of pts) {
        p.x += p.vx + Math.cos(time + p.phase) * 0.08;
        p.y += p.vy + Math.sin(time + p.phase) * 0.08;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const a = p.alpha * (0.65 + 0.35 * Math.sin(time * 1.6 + p.phase));
        ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Incorrect password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.login({ password });
      onSuccess(res.user);
    } catch {
      setError('Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 w-full h-full"
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-[#08080B]/90 backdrop-blur-xl px-7 py-9 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center mb-7">
          <h1 className="font-mono text-xs tracking-[0.28em] text-white uppercase">
            ADMIN PORTAL
          </h1>
          <div className="mt-5 w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-zinc-300">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter Password"
              aria-label="Password"
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#050507] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div role="alert" className="text-center text-xs font-mono text-zinc-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black text-xs font-mono font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'VERIFYING...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};
