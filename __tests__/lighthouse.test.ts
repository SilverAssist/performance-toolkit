/**
 * Tests for Lighthouse Runner
 */

import {
  LighthouseRunner,
  createNodeRunner,
  createPSIRunner,
  createHybridRunners,
  getDefaultThresholds,
} from "../src/lighthouse";

describe("LighthouseRunner", () => {
  describe("constructor", () => {
    it("should create runner with default options", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      });

      const config = runner.getConfig();
      expect(config.ci.collect.url).toEqual(["https://example.com"]);
      expect(config.ci.collect.method).toBe("node");
      expect(config.ci.collect.numberOfRuns).toBe(3);
    });

    it("should create runner with PSI method", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
        method: "psi",
        psiApiKey: "test-key",
      });

      const config = runner.getConfig();
      expect(config.ci.collect.method).toBe("psi");
      expect(config.ci.collect.psiApiKey).toBe("test-key");
    });

    it("should set chrome flags for node method", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
        method: "node",
        chromeFlags: ["--headless", "--disable-gpu"],
      });

      const config = runner.getConfig();
      expect(config.ci.collect.settings?.chromeFlags).toEqual([
        "--headless",
        "--disable-gpu",
      ]);
    });
  });

  describe("withAssertions", () => {
    it("should add performance threshold", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withAssertions({
        performance: 90,
      });

      const config = runner.getConfig();
      expect(config.ci.assert?.assertions["categories:performance"]).toEqual([
        "error",
        { minScore: 0.9 },
      ]);
    });

    it("should add LCP threshold", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withAssertions({
        lcp: 2500,
      });

      const config = runner.getConfig();
      expect(config.ci.assert?.assertions["largest-contentful-paint"]).toEqual([
        "error",
        { maxNumericValue: 2500 },
      ]);
    });

    it("should add multiple thresholds", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withAssertions({
        performance: 80,
        lcp: 3000,
        cls: 0.1,
        tbt: 300,
      });

      const config = runner.getConfig();
      expect(config.ci.assert?.assertions["categories:performance"]).toBeDefined();
      expect(config.ci.assert?.assertions["largest-contentful-paint"]).toBeDefined();
      expect(config.ci.assert?.assertions["cumulative-layout-shift"]).toBeDefined();
      expect(config.ci.assert?.assertions["total-blocking-time"]).toBeDefined();
    });

    it("should support method chaining", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      });

      const result = runner.withAssertions({ performance: 90 });
      expect(result).toBe(runner);
    });
  });

  describe("withTemporaryStorage", () => {
    it("should configure temporary public storage", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withTemporaryStorage();

      const config = runner.getConfig();
      expect(config.ci.upload?.target).toBe("temporary-public-storage");
    });
  });

  describe("withLHCIServer", () => {
    it("should configure LHCI server upload", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withLHCIServer("https://lhci.example.com", "build-token");

      const config = runner.getConfig();
      expect(config.ci.upload?.target).toBe("lhci");
      expect(config.ci.upload?.serverBaseUrl).toBe("https://lhci.example.com");
      expect(config.ci.upload?.token).toBe("build-token");
    });
  });

  describe("generateConfigFile", () => {
    it("should generate valid config file content", () => {
      const runner = new LighthouseRunner({
        urls: ["https://example.com"],
      }).withAssertions({
        performance: 90,
      });

      const content = runner.generateConfigFile();

      expect(content).toContain("module.exports =");
      expect(content).toContain('"url"');
      expect(content).toContain("https://example.com");
    });
  });
});

describe("Factory functions", () => {
  describe("createNodeRunner", () => {
    it("should create runner with node method", () => {
      const runner = createNodeRunner(["https://staging.example.com"]);
      const config = runner.getConfig();

      expect(config.ci.collect.method).toBe("node");
      expect(config.ci.collect.url).toEqual(["https://staging.example.com"]);
    });

    it("should accept additional options", () => {
      const runner = createNodeRunner(["https://staging.example.com"], {
        numberOfRuns: 5,
      });
      const config = runner.getConfig();

      expect(config.ci.collect.numberOfRuns).toBe(5);
    });
  });

  describe("createPSIRunner", () => {
    it("should create runner with psi method", () => {
      const runner = createPSIRunner(
        ["https://www.example.com"],
        "test-api-key"
      );
      const config = runner.getConfig();

      expect(config.ci.collect.method).toBe("psi");
      expect(config.ci.collect.psiApiKey).toBe("test-api-key");
    });
  });

  describe("createHybridRunners", () => {
    it("should create staging and production runners", () => {
      const { staging, production } = createHybridRunners({
        stagingUrls: ["https://staging.example.com"],
        productionUrls: ["https://www.example.com"],
        psiApiKey: "test-key",
      });

      expect(staging.getConfig().ci.collect.method).toBe("node");
      expect(production.getConfig().ci.collect.method).toBe("psi");
    });

    it("should apply thresholds to both runners", () => {
      const { staging, production } = createHybridRunners({
        stagingUrls: ["https://staging.example.com"],
        productionUrls: ["https://www.example.com"],
        psiApiKey: "test-key",
        thresholds: { performance: 80 },
      });

      expect(staging.getConfig().ci.assert).toBeDefined();
      expect(production.getConfig().ci.assert).toBeDefined();
    });
  });
});

describe("getDefaultThresholds", () => {
  it("should return standard thresholds by default", () => {
    const thresholds = getDefaultThresholds();

    expect(thresholds.performance).toBe(50);
    expect(thresholds.lcp).toBe(4000);
    expect(thresholds.cls).toBe(0.25);
  });

  it("should return strict thresholds when requested", () => {
    const thresholds = getDefaultThresholds(true);

    expect(thresholds.performance).toBe(90);
    expect(thresholds.lcp).toBe(2500);
    expect(thresholds.cls).toBe(0.1);
  });
});
