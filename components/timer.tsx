"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  startTime?: Date;
  className?: string;
}

export function Timer({ durationMinutes, onTimeUp, startTime, className }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);
  const [isWarning, setIsWarning] = useState(false);
  const [isDanger, setIsDanger] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeLeft(remaining);
    }
  }, [startTime, durationMinutes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Warning at 5 minutes
        if (newTime <= 300 && newTime > 60) {
          setIsWarning(true);
          setIsDanger(false);
        }
        // Danger at 1 minute
        else if (newTime <= 60) {
          setIsWarning(false);
          setIsDanger(true);
        }

        if (newTime <= 0) {
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-5 py-3 font-mono text-lg font-bold transition-all duration-300",
        !isWarning && !isDanger && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        isWarning && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
        isDanger && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse-glow",
        className
      )}
    >
      {isDanger ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span className="tabular-nums">{formatTime(timeLeft)}</span>
      {isDanger && (
        <span className="text-sm font-medium">Time running out!</span>
      )}
    </div>
  );
}

// Compact timer for header
export function CompactTimer({ durationMinutes, onTimeUp, startTime }: Omit<TimerProps, "className">) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);

  useEffect(() => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeLeft(remaining);
    }
  }, [startTime, durationMinutes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isDanger = timeLeft <= 60;
  const isWarning = timeLeft <= 300 && !isDanger;

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums",
        !isWarning && !isDanger && "text-slate-700 dark:text-slate-200",
        isWarning && "text-amber-600 dark:text-amber-400",
        isDanger && "text-red-600 dark:text-red-400 animate-pulse"
      )}
    >
      {formatTime(timeLeft)}
    </span>
  );
}
