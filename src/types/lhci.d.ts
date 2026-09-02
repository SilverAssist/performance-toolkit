/**
 * @silverassist/performance-toolkit
 *
 * Type declarations for @lhci/cli (no bundled types).
 *
 * @packageDocumentation
 */

declare module "@lhci/cli" {
  export interface LHCIAutorunResult {
    success: boolean;
    rawResults?: unknown[];
  }

  export interface LHCIConfigCI {
    collect: Record<string, unknown>;
    assert?: Record<string, unknown>;
    upload?: Record<string, unknown>;
  }

  export function autorun(options?: LHCIConfigCI): Promise<LHCIAutorunResult>;
}
