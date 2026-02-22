import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 72;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);
  const pullY = useMotionValue(0);
  const opacity = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
  const rotate = useTransform(pullY, [0, MAX_PULL], [0, 360]);
  const scale = useTransform(pullY, [0, PULL_THRESHOLD], [0.5, 1]);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) {
      // Damped pull
      pullY.set(Math.min(MAX_PULL, delta * 0.5));
    }
  }, [refreshing, pullY]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY.get() >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullY.set(PULL_THRESHOLD * 0.6);
      await onRefresh();
      setRefreshing(false);
    }
    pullY.set(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Indicator */}
      <motion.div
        style={{ opacity, y: pullY }}
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
        initial={false}
      >
        <div className="mt-2 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
          <motion.div style={{ rotate, scale }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'text-purple-400 animate-spin' : 'text-slate-400'}`} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div style={{ y: useTransform(pullY, v => Math.min(v, MAX_PULL)) }}>
        {children}
      </motion.div>
    </div>
  );
}