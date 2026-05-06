import { useEffect, useRef } from 'react';

/**
 * usePerformanceMonitoring
 * A specialized hook to detect performance bottlenecks in UI rendering
 * when the application is under heavy load (10,000+ interactions).
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderCount = useRef(0);
  const startTime = performance.now();

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 50) { // Increased threshold to 50ms for meaningful jank detection
      console.warn(`[Performance] ${componentName} Heavy Render: ${duration.toFixed(2)}ms`);
    }
  });

  return renderCount.current;
}
