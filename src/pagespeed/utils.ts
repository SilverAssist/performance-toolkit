/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed utility functions for data extraction and formatting.
 *
 * @module pagespeed/utils
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import { THIRD_PARTY_PATTERNS } from "./constants";

/**
 * Formats cache TTL to human-readable string
 */
export function formatCacheTTL(ms: number): string {
  if (ms === 0) return "No cache";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days}d`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

/**
 * Extracts entity/third-party name from URL
 */
export function extractEntityFromUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;

    for (const [pattern, name] of Object.entries(THIRD_PARTY_PATTERNS)) {
      if (hostname.includes(pattern)) {
        return name;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Categorizes third-party by type
 */
export function categorizeThirdParty(entity: string): string {
  const lower = entity.toLowerCase();
  if (lower.includes("analytics") || lower.includes("tag manager"))
    return "analytics";
  if (
    lower.includes("facebook") ||
    lower.includes("twitter") ||
    lower.includes("linkedin")
  )
    return "social";
  if (lower.includes("ad") || lower.includes("doubleclick"))
    return "advertising";
  if (
    lower.includes("cdn") ||
    lower.includes("cloudflare") ||
    lower.includes("cloudfront")
  )
    return "cdn";
  if (lower.includes("font")) return "fonts";
  if (
    lower.includes("trustedform") ||
    lower.includes("leadid") ||
    lower.includes("jornaya")
  )
    return "lead-tracking";
  return "other";
}

/**
 * Checks if URL is first-party
 */
export function isFirstParty(url: string, hostDomain: string): boolean {
  try {
    const urlHost = new URL(url).hostname;
    return urlHost.includes(hostDomain) || urlHost === hostDomain;
  } catch {
    return false;
  }
}

/**
 * Gets host domain from URL
 * @param url - The URL to extract domain from
 * @returns The host domain
 */
export function getHostDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
