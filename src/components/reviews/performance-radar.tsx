'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Review, HealthStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { Award, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PerformanceRadarProps {
  review?: Review;
  interactive?: boolean;
  onRatingChange?: (key: string, value: number) => void;
}

export function PerformanceRadar({
  review,
  interactive = false,
  onRatingChange,
}: PerformanceRadarProps) {
  const [ratings, setRatings] = useState({
    delivery: review?.rating_delivery || 4,
    communication: review?.rating_communication || 4,
    reliability: review?.rating_reliability || 5,
    proactivity: review?.rating_proactivity || 4,
    clientSatisfaction: review?.rating_client_satisfaction || 4,
  });

  const axes = [
    { key: 'delivery', label: 'Delivery Quality', value: ratings.delivery, angle: -90 },
    { key: 'communication', label: 'Communication', value: ratings.communication, angle: -18 },
    { key: 'reliability', label: 'Reliability', value: ratings.reliability, angle: 54 },
    { key: 'proactivity', label: 'Proactivity', value: ratings.proactivity, angle: 126 },
    { key: 'clientSatisfaction', label: 'Client Satisfaction', value: ratings.clientSatisfaction, angle: 198 },
  ];

  const center = 150;
  const maxRadius = 100;

  // Compute (x, y) coordinates for a given angle and rating (1 to 5)
  const getCoordinates = (angleDegrees: number, value: number) => {
    const angleRad = (angleDegrees * Math.PI) / 180;
    const r = (value / 5) * maxRadius;
    const x = center + r * Math.cos(angleRad);
    const y = center + r * Math.sin(angleRad);
    return { x, y };
  };

  const polygonPoints = axes
    .map((axis) => {
      const { x, y } = getCoordinates(axis.angle, axis.value);
      return `${x},${y}`;
    })
    .join(' ');

  const avgScore =
    (ratings.delivery +
      ratings.communication +
      ratings.reliability +
      ratings.proactivity +
      ratings.clientSatisfaction) /
    5;

  const healthColor: Record<HealthStatus, { text: string; bg: string; stroke: string; fill: string; glow: string }> = {
    Green: {
      text: 'text-cyan-300',
      bg: 'bg-cyan-500/15 border-cyan-500/40',
      stroke: '#00f0ff',
      fill: 'rgba(0, 240, 255, 0.22)',
      glow: 'shadow-[0_0_12px_rgba(0,240,255,0.25)]',
    },
    Yellow: {
      text: 'text-amber-300',
      bg: 'bg-amber-500/15 border-amber-500/40',
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.22)',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    },
    Red: {
      text: 'text-rose-300',
      bg: 'bg-rose-500/20 border-rose-500/40',
      stroke: '#f43f5e',
      fill: 'rgba(244, 63, 94, 0.25)',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    },
  };

  const currentHealth: HealthStatus =
    avgScore >= 4.0 ? 'Green' : avgScore >= 3.0 ? 'Yellow' : 'Red';
  const theme = healthColor[currentHealth];

  const handleUpdate = (key: string, val: number) => {
    if (!interactive) return;
    setRatings((prev) => ({ ...prev, [key]: val }));
    if (onRatingChange) onRatingChange(key, val);
  };

  return (
    <div className="metallic-card rounded-2xl p-5 border border-white/[0.12] space-y-4 shadow-xl relative overflow-hidden">
      {/* Specular top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">Performance Radar Matrix</h4>
            <span
              className={cn(
                'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                theme.bg,
                theme.text,
                theme.glow
              )}
            >
              HEALTH: {currentHealth}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            5 Core Delivery Dimensions • Weighted Index
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black font-mono tracking-tight text-slate-100">
            {avgScore.toFixed(2)}
            <span className="text-xs text-slate-400 font-normal"> / 5.0</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
        {/* SVG Radar */}
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          <svg width="300" height="300" className="overflow-visible">
            {/* Concentric reference polygons */}
            {[1, 2, 3, 4, 5].map((level) => {
              const points = axes
                .map((axis) => {
                  const { x, y } = getCoordinates(axis.angle, level);
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.09)"
                  strokeWidth="1"
                  strokeDasharray={level === 5 ? 'none' : '2 2'}
                />
              );
            })}

            {/* Radial axis lines */}
            {axes.map((axis) => {
              const { x, y } = getCoordinates(axis.angle, 5);
              return (
                <line
                  key={axis.key}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Active Data Polygon */}
            <motion.polygon
              initial={false}
              animate={{ points: polygonPoints }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              fill={theme.fill}
              stroke={theme.stroke}
              strokeWidth="2.5"
            />

            {/* Data Points */}
            {axes.map((axis) => {
              const { x, y } = getCoordinates(axis.angle, axis.value);
              return (
                <g key={axis.key}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#141824"
                    stroke={theme.stroke}
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend & Rating Breakdown Controls */}
        <div className="w-full sm:w-56 space-y-2 text-xs">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="p-2.5 rounded-xl bg-[#181d29] border border-white/[0.08] hover:border-white/15 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-medium text-slate-200">{axis.label}</div>
                <div className="text-[10px] font-mono text-slate-400">Score: {axis.value}/5</div>
              </div>

              {interactive ? (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleUpdate(axis.key, n)}
                      className={cn(
                        'w-5 h-5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer',
                        axis.value === n
                          ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                          : 'bg-[#1e2433] text-slate-400 hover:text-white'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-14 h-1.5 rounded-full bg-[#1e2433] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(axis.value / 5) * 100}%`,
                      backgroundColor: theme.stroke,
                      boxShadow: `0 0 6px ${theme.stroke}`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
