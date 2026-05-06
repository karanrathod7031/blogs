import { useEffect, useRef } from 'react';

/**
 * usePerformanceMonitoring
 * A specialized hook to detect performance bottlenecks in UI rendering
 * when the application is under heavy load (10,000+ interactions).
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    renderCount.current++;
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    if (duration > 50) {
      console.warn(`[Performance] ${componentName} Heavy Render: ${duration.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return renderCount.current;
}
