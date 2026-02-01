/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed API constants and configuration values.
 *
 * @module pagespeed/constants
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { Category } from "../types";

/** PageSpeed Insights API base URL */
export const PSI_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT = 60000;

/** Default categories to analyze */
export const DEFAULT_CATEGORIES: Category[] = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

/** Audit IDs for performance improvement opportunities */
export const OPPORTUNITY_AUDITS = [
  "render-blocking-resources",
  "unused-css-rules",
  "unused-javascript",
  "modern-image-formats",
  "offscreen-images",
  "unminified-css",
  "unminified-javascript",
  "efficient-animated-content",
  "uses-optimized-images",
  "uses-responsive-images",
  "server-response-time",
  "uses-text-compression",
  "uses-rel-preconnect",
  "uses-rel-preload",
  "font-display",
  "third-party-summary",
] as const;

/** Audit IDs for diagnostic information */
export const DIAGNOSTIC_AUDITS = [
  "mainthread-work-breakdown",
  "bootup-time",
  "dom-size",
  "critical-request-chains",
  "network-requests",
  "network-rtt",
  "network-server-latency",
  "long-tasks",
  "non-composited-animations",
  "unsized-images",
  "viewport",
  "no-document-write",
  "js-libraries",
] as const;

/** Third-party entity name patterns */
export const THIRD_PARTY_PATTERNS: Record<string, string> = {
  facebook: "Facebook",
  "fb.com": "Facebook",
  fbcdn: "Facebook",
  google: "Google",
  googleapis: "Google APIs",
  gstatic: "Google Static",
  googletagmanager: "Google Tag Manager",
  "google-analytics": "Google Analytics",
  doubleclick: "DoubleClick",
  twitter: "Twitter",
  twimg: "Twitter",
  linkedin: "LinkedIn",
  trustedform: "TrustedForm",
  leadid: "LeadID",
  jornaya: "Jornaya",
  cloudflare: "Cloudflare",
  cloudfront: "CloudFront",
  amazonaws: "AWS",
  cdn: "CDN",
  jquery: "jQuery",
  unpkg: "unpkg",
  cdnjs: "cdnjs",
  bootstrapcdn: "Bootstrap CDN",
};
