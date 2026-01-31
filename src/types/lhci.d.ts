/**
 * Type declarations for @lhci/cli
 * This package doesn't ship with TypeScript types
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

  export function autorun(
    options?: LHCIConfigCI
  ): Promise<LHCIAutorunResult>;
}
