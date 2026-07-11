"use client";

import { useEffect, useState } from "react";

interface CounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

export default function Counter({ target, suffix = "", duration = 2000 }: CounterProps) {
  // Start with the final target value so the server render matches exactly
  const [count, setCount] = useState(target);

  useEffect(() => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Easing function: easeOutQuad
      const easeOutQuad = percentage * (2 - percentage);
      const currentValue = Math.floor(easeOutQuad * target);

      setCount(currentValue);

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count}{suffix}</span>;
}
