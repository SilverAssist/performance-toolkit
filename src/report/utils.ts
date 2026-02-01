/**
 * @silverassist/performance-toolkit
 *
 * Report utility functions for formatting and severity calculations.
 *
 * @module report/utils
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { DiagnosticItem } from "../types";

/**
 * Formats bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/**
 * Truncates URL to specified length with ellipsis
 */
export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

/**
 * Calculates a normalized score between 0-1 based on thresholds
 */
export function calculateScore(
  value: number,
  goodThreshold: number,
  poorThreshold: number,
): number {
  if (value <= goodThreshold) return 1;
  if (value >= poorThreshold) return 0;
  return 1 - (value - goodThreshold) / (poorThreshold - goodThreshold);
}

/**
 * Determines severity level based on byte size
 */
export function getSeverityByBytes(
  bytes: number,
  moderate: number = 100000,
  serious: number = 300000,
  critical: number = 500000,
): DiagnosticItem["severity"] {
  if (bytes >= critical) return "critical";
  if (bytes >= serious) return "serious";
  if (bytes >= moderate) return "moderate";
  return "minor";
}

/**
 * Determines severity level based on time in milliseconds
 */
export function getSeverityByTime(
  ms: number,
  moderate: number = 300,
  serious: number = 800,
  critical: number = 1500,
): DiagnosticItem["severity"] {
  if (ms >= critical) return "critical";
  if (ms >= serious) return "serious";
  if (ms >= moderate) return "moderate";
  return "minor";
}
