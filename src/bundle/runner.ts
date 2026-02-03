/**
 * @silverassist/performance-toolkit
 *
 * Bundle analyzer for Next.js applications using @next/bundle-analyzer.
 *
 * @module bundle/runner
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type {
  BundleAnalyzerOptions,
  BundleAnalysisResult,
  BundleSummary,
} from "../types/bundle";

const execAsync = promisify(exec);

type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * Runner for Next.js bundle analysis using @next/bundle-analyzer
 */
export class BundleAnalyzerRunner {
  private projectPath: string;
  private options: BundleAnalyzerOptions;
  private onLog?: (message: string) => void;
  private onError?: (message: string) => void;

  constructor(options: BundleAnalyzerOptions = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.options = options;
  }

  /**
   * Set logging callback for CLI usage
   */
  setLogCallback(onLog: (message: string) => void): void {
    this.onLog = onLog;
  }

  /**
   * Set error callback for CLI usage
   */
  setErrorCallback(onError: (message: string) => void): void {
    this.onError = onError;
  }

  /**
   * Log message (used by CLI layer)
   */
  private log(message: string): void {
    if (this.onLog) {
      this.onLog(message);
    }
  }

  /**
   * Log error (used by CLI layer)
   */
  private logError(message: string): void {
    if (this.onError) {
      this.onError(message);
    }
  }

  /**
   * Detect the package manager used in the project
   */
  private detectPackageManager(): PackageManager {
    if (fs.existsSync(path.join(this.projectPath, "yarn.lock"))) {
      return "yarn";
    }

    if (fs.existsSync(path.join(this.projectPath, "pnpm-lock.yaml"))) {
      return "pnpm";
    }

    return "npm";
  }

  /**
   * Check if @next/bundle-analyzer is installed
   */
  private isAnalyzerInstalled(): boolean {
    const packageJsonPath = path.join(this.projectPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      return "@next/bundle-analyzer" in deps;
    } catch {
      return false;
    }
  }

  /**
   * Check if this is a Next.js project
   */
  private isNextJsProject(): boolean {
    const packageJsonPath = path.join(this.projectPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      return "next" in deps;
    } catch {
      return false;
    }
  }

  /**
   * Install @next/bundle-analyzer
   */
  private async installAnalyzer(): Promise<boolean> {
    try {
      this.log("📦 Installing @next/bundle-analyzer...");

      const packageManager = this.detectPackageManager();
      const installCmd =
        packageManager === "yarn"
          ? "yarn add --dev @next/bundle-analyzer"
          : packageManager === "pnpm"
            ? "pnpm add --save-dev @next/bundle-analyzer"
            : "npm install --save-dev @next/bundle-analyzer";

      await execAsync(installCmd, { cwd: this.projectPath });
      this.log("✅ @next/bundle-analyzer installed successfully");
      return true;
    } catch (error) {
      const err = error as {
        message?: string;
        stderr?: string;
        stdout?: string;
      };
      this.logError("❌ Failed to install @next/bundle-analyzer");

      if (err?.message) {
        this.logError(`Error: ${err.message}`);
      }

      if (err?.stderr) {
        this.logError(`stderr: ${err.stderr}`);
      }

      return false;
    }
  }

  /**
   * Backup existing next.config file
   */
  private backupNextConfig(): string | null {
    const configFiles = ["next.config.js", "next.config.mjs", "next.config.ts"];

    for (const configFile of configFiles) {
      const configPath = path.join(this.projectPath, configFile);
      if (fs.existsSync(configPath)) {
        const backupPath = configPath + ".backup";

        // Check if backup already exists
        if (fs.existsSync(backupPath)) {
          throw new Error(
            `Backup file already exists for ${configFile} at ${backupPath}. ` +
              "Please restore or remove this backup file before running the bundle analyzer again.",
          );
        }

        fs.copyFileSync(configPath, backupPath);
        return configFile;
      }
    }

    return null;
  }

  /**
   * Inject bundle analyzer configuration into next.config
   */
  private async injectAnalyzerConfig(configFile: string): Promise<void> {
    const configPath = path.join(this.projectPath, configFile);
    let content = fs.readFileSync(configPath, "utf-8");

    // Check if already configured by verifying both import/require and wrapper usage
    const hasAnalyzerImportOrRequire =
      /import\s+[^'"]*['"]@next\/bundle-analyzer['"]/.test(content) ||
      /\brequire\(\s*['"]@next\/bundle-analyzer['"]\s*\)/.test(content);
    const hasWithBundleAnalyzerWrapper = /withBundleAnalyzer\s*\(/.test(
      content,
    );

    if (hasAnalyzerImportOrRequire && hasWithBundleAnalyzerWrapper) {
      this.log("ℹ️  Bundle analyzer already configured");
      return;
    }

    const analyzerImport =
      configFile.endsWith(".mjs") || configFile.endsWith(".ts")
        ? `import bundleAnalyzer from '@next/bundle-analyzer';\n\n`
        : `const bundleAnalyzer = require('@next/bundle-analyzer');\n\n`;

    const analyzerWrapper = `const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});\n\n`;

    // Insert at the beginning
    content = analyzerImport + analyzerWrapper + content;

    // Wrap the export - improved regex to handle multi-line statements
    if (configFile.endsWith(".mjs") || configFile.endsWith(".ts")) {
      content = content.replace(
        /export\s+default\s+([\s\S]+?)(?=\n\s*$|$)/m,
        "export default withBundleAnalyzer($1)",
      );
    } else {
      content = content.replace(
        /module\.exports\s*=\s*([\s\S]+?)(?=\n\s*$|$)/m,
        "module.exports = withBundleAnalyzer($1)",
      );
    }

    fs.writeFileSync(configPath, content);
    this.log("✅ Injected bundle analyzer configuration");
  }

  /**
   * Restore original next.config from backup
   */
  private restoreNextConfig(configFile: string): void {
    const configPath = path.join(this.projectPath, configFile);
    const backupPath = configPath + ".backup";

    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, configPath);
      fs.unlinkSync(backupPath);
      this.log("✅ Restored original configuration");
    }
  }

  /**
   * Run Next.js build with ANALYZE=true
   */
  private async runBuild(): Promise<boolean> {
    try {
      this.log("🔨 Building project with bundle analysis...");

      const packageManager = this.detectPackageManager();
      const buildCmd =
        packageManager === "yarn"
          ? "yarn build"
          : packageManager === "pnpm"
            ? "pnpm build"
            : "npm run build";

      await execAsync(buildCmd, {
        cwd: this.projectPath,
        env: { ...process.env, ANALYZE: "true" },
      });

      this.log("✅ Build completed successfully");
      return true;
    } catch (error) {
      const err = error as {
        message?: string;
        stderr?: string;
        stdout?: string;
      };
      this.logError("❌ Build failed");

      if (err?.message) {
        this.logError(`Error: ${err.message}`);
      }

      if (err?.stderr) {
        this.logError(`stderr: ${err.stderr}`);
      }

      return false;
    }
  }

  /**
   * Parse bundle stats from generated reports
   */
  private async parseBundleStats(): Promise<BundleSummary | undefined> {
    const statsPath = path.join(this.projectPath, ".next", "analyze");

    if (!fs.existsSync(statsPath)) {
      return undefined;
    }

    // This is a simplified version - in production, you'd parse the actual webpack stats
    const summary: BundleSummary = {
      totalClientSize: 0,
      largestChunks: [],
      largestDependencies: [],
      recommendations: [
        "Check client bundle HTML report for detailed breakdown",
        "Consider code splitting for large chunks",
        "Review third-party dependencies for optimization opportunities",
        "Use dynamic imports for heavy components",
      ],
    };

    return summary;
  }

  /**
   * Find generated report files
   */
  private findReportFiles(): {
    client?: string;
    server?: string;
    edge?: string;
  } {
    const reports: { client?: string; server?: string; edge?: string } = {};
    const nextDir = path.join(this.projectPath, ".next");

    const clientReport = path.join(nextDir, "analyze", "client.html");
    const serverReport = path.join(nextDir, "analyze", "server.html");
    const edgeReport = path.join(nextDir, "analyze", "edge.html");

    if (fs.existsSync(clientReport)) reports.client = clientReport;
    if (fs.existsSync(serverReport)) reports.server = serverReport;
    if (fs.existsSync(edgeReport)) reports.edge = edgeReport;

    return reports;
  }

  /**
   * Run bundle analysis
   */
  async analyze(): Promise<BundleAnalysisResult> {
    let installedAnalyzer = false;
    let configFile: string | null = null;

    try {
      // Check if this is a Next.js project
      if (!this.isNextJsProject()) {
        return {
          success: false,
          projectPath: this.projectPath,
          installedAnalyzer: false,
          error: "Not a Next.js project. Bundle analysis requires Next.js.",
        };
      }

      // Check and install analyzer if needed
      const analyzerInstalled = this.isAnalyzerInstalled();
      if (!analyzerInstalled) {
        if (this.options.autoInstall) {
          const installed = await this.installAnalyzer();
          if (!installed) {
            return {
              success: false,
              projectPath: this.projectPath,
              installedAnalyzer: false,
              error: "Failed to install @next/bundle-analyzer",
            };
          }
          installedAnalyzer = true;
        } else {
          return {
            success: false,
            projectPath: this.projectPath,
            installedAnalyzer: false,
            error:
              "@next/bundle-analyzer not installed. Run with --auto-install flag or install manually.",
          };
        }
      }

      // Backup and inject configuration
      configFile = this.backupNextConfig();
      if (configFile) {
        await this.injectAnalyzerConfig(configFile);
      } else {
        return {
          success: false,
          projectPath: this.projectPath,
          installedAnalyzer,
          error: "No next.config file found",
        };
      }

      // Run build
      const buildSuccess = await this.runBuild();
      if (!buildSuccess) {
        return {
          success: false,
          projectPath: this.projectPath,
          installedAnalyzer,
          error: "Build failed",
        };
      }

      // Parse results
      const reports = this.findReportFiles();
      const summary = await this.parseBundleStats();

      return {
        success: true,
        projectPath: this.projectPath,
        installedAnalyzer,
        reports,
        summary,
      };
    } catch (error) {
      return {
        success: false,
        projectPath: this.projectPath,
        installedAnalyzer,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      // Always restore original config, but don't let restore errors mask the original one
      if (configFile) {
        try {
          this.restoreNextConfig(configFile);
        } catch (restoreError) {
          // Log restore error without throwing to preserve any original error
          this.logError(
            `Failed to restore original Next.js configuration: ${
              restoreError instanceof Error
                ? restoreError.message
                : restoreError
            }`,
          );
        }
      }
    }
  }
}

/**
 * Create a bundle analyzer runner
 */
export function createBundleAnalyzer(
  options?: BundleAnalyzerOptions,
): BundleAnalyzerRunner {
  return new BundleAnalyzerRunner(options);
}

/**
 * Quick analysis function
 */
export async function analyzeBundle(
  options?: BundleAnalyzerOptions,
): Promise<BundleAnalysisResult> {
  const runner = createBundleAnalyzer(options);
  return runner.analyze();
}
