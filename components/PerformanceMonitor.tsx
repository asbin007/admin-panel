"use client";

import { useEffect, useState } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export default function PerformanceMonitor({ componentName, children }: PerformanceMonitorProps) {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  // Removed unused isLoading state

  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      setLoadTime(loadDuration);
      setIsLoading(false);
      
      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} loaded in ${loadDuration.toFixed(2)}ms`);
        
        // Warn if load time is too high
        if (loadDuration > 1000) {
          console.warn(`⚠️ ${componentName} took ${loadDuration.toFixed(2)}ms to load - consider optimization`);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(handleLoad);

    return () => {
      // Cleanup if component unmounts before load
    };
  }, [componentName]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && loadTime && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-xs z-50">
          {componentName}: {loadTime.toFixed(0)}ms
        </div>
      )}
    </>
  );
} 