'use client'

import { motion } from 'framer-motion'

interface CalorieRingProps {
  consumed: number
  target: number
  size?: number
}

export default function CalorieRing({ consumed, target, size = 140 }: CalorieRingProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // warna berubah kalo udh deket/melebihi target
  let strokeColor = 'var(--primary)'
  if (pct > 90) strokeColor = 'var(--danger)'
  else if (pct > 70) strokeColor = 'var(--warning)'

  return (
    <div className="calorie-ring-container">
      <div className="calorie-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* bg circle */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--bg-glass)" strokeWidth={strokeWidth}
          />
          {/* progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * pct) / 100 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="calorie-ring-text">
          <div className="value">{consumed}</div>
          <div className="label">/ {target} kcal</div>
        </div>
      </div>
    </div>
  )
}
