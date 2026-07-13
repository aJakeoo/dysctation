"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  active: boolean;
}

const BAR_COUNT = 34;
const ACTIVE_COLOR = "#4f7fc7";
const IDLE_COLOR = "#e6e2da";

export function Waveform({ analyser, active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const dataArray = new Uint8Array(analyser?.frequencyBinCount ?? 0);
    let raf: number;
    let idlePhase = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / BAR_COUNT;
      const gap = barWidth * 0.35;

      for (let i = 0; i < BAR_COUNT; i++) {
        let level: number;

        if (active && analyser) {
          analyser.getByteFrequencyData(dataArray);
          const dataIndex = Math.floor(
            (i / BAR_COUNT) * dataArray.length * 0.6
          );
          level = dataArray[dataIndex] / 255;
        } else {
          level = 0.06 + 0.03 * Math.sin(idlePhase + i * 0.6);
        }

        const minHeight = height * 0.08;
        const barHeight = Math.max(minHeight, level * height);
        const x = i * barWidth + gap / 2;
        const y = (height - barHeight) / 2;
        const w = barWidth - gap;

        ctx.fillStyle = active ? ACTIVE_COLOR : IDLE_COLOR;
        ctx.beginPath();
        ctx.roundRect(x, y, w, barHeight, w / 2);
        ctx.fill();
      }

      idlePhase += 0.03;
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, active]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
