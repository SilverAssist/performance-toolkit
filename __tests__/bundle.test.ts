/**
 * Tests for Bundle Analyzer
 */

import { BundleAnalyzerRunner } from "../src/bundle";
import * as fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  copyFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock child_process module
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("BundleAnalyzerRunner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isNextJsProject", () => {
    it("should detect Next.js project from package.json", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["isNextJsProject"]();
      expect(result).toBe(true);
    });

    it("should return false for non-Next.js project", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            react: "18.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["isNextJsProject"]();
      expect(result).toBe(false);
    });
  });

  describe("isAnalyzerInstalled", () => {
    it("should detect installed @next/bundle-analyzer", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          devDependencies: {
            "@next/bundle-analyzer": "^14.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["isAnalyzerInstalled"]();
      expect(result).toBe(true);
    });

    it("should return false when analyzer is not installed", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["isAnalyzerInstalled"]();
      expect(result).toBe(false);
    });
  });

  describe("analyze", () => {
    it("should return error for non-Next.js project", async () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            react: "18.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = await runner.analyze();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Not a Next.js project");
    });

    it("should return error when analyzer is not installed and autoInstall is false", async () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
        autoInstall: false,
      });

      const result = await runner.analyze();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("not installed");
    });

    it("should return error when no next.config file is found", async () => {
      const testProjectPath = "/test/project";
      
      let callCount = 0;
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        callCount++;
        const pathStr = p.toString();
        
        // First two calls: package.json checks
        if (callCount <= 2 && pathStr.includes("package.json")) {
          return true;
        }
        // Subsequent calls: next.config files don't exist
        return false;
      });

      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
          },
          devDependencies: {
            "@next/bundle-analyzer": "^14.0.0",
          },
        })
      );

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = await runner.analyze();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("No next.config file found");
    });
  });

  describe("backupNextConfig", () => {
    it("should backup and return next.config.js if it exists", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        return p.toString().endsWith("next.config.js");
      });

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["backupNextConfig"]();
      
      expect(result).toBe("next.config.js");
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    it("should return null if no config file exists", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const result = runner["backupNextConfig"]();
      
      expect(result).toBeNull();
    });
  });

  describe("findReportFiles", () => {
    it("should find all generated report files", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        const pathStr = p.toString();
        return (
          pathStr.includes("client.html") ||
          pathStr.includes("server.html") ||
          pathStr.includes("edge.html")
        );
      });

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const reports = runner["findReportFiles"]();
      
      expect(reports.client).toBeDefined();
      expect(reports.server).toBeDefined();
      expect(reports.edge).toBeDefined();
    });

    it("should return empty object when no reports exist", () => {
      const testProjectPath = "/test/project";
      
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const runner = new BundleAnalyzerRunner({
        projectPath: testProjectPath,
      });

      const reports = runner["findReportFiles"]();
      
      expect(reports.client).toBeUndefined();
      expect(reports.server).toBeUndefined();
      expect(reports.edge).toBeUndefined();
    });
  });
});
