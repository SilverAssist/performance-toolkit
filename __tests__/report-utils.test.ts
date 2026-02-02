/**
 * Tests for Report Utility Functions
 */

import {
  formatBytes,
  truncateUrl,
  calculateScore,
  getSeverityByBytes,
  getSeverityByTime,
} from "../src/report/utils";

describe("formatBytes", () => {
  it("should format bytes less than 1024 as B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(100)).toBe("100 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("should format bytes in KiB range", () => {
    expect(formatBytes(1024)).toBe("1 KiB");
    expect(formatBytes(2048)).toBe("2 KiB");
    expect(formatBytes(102400)).toBe("100 KiB");
    expect(formatBytes(1048575)).toBe("1024 KiB");
  });

  it("should format bytes in MiB range", () => {
    expect(formatBytes(1048576)).toBe("1.0 MiB");
    expect(formatBytes(2097152)).toBe("2.0 MiB");
    expect(formatBytes(5242880)).toBe("5.0 MiB");
    expect(formatBytes(10485760)).toBe("10.0 MiB");
  });
});

describe("truncateUrl", () => {
  it("should not truncate URLs shorter than maxLength", () => {
    expect(truncateUrl("https://example.com")).toBe("https://example.com");
    expect(truncateUrl("https://example.com", 50)).toBe("https://example.com");
  });

  it("should truncate URLs longer than maxLength with ellipsis", () => {
    const longUrl = "https://example.com/very/long/path/to/resource.js";
    expect(truncateUrl(longUrl, 30)).toBe("https://example.com/very/lo...");
    expect(truncateUrl(longUrl, 30).length).toBe(30);
  });

  it("should use default maxLength of 50", () => {
    const url60chars = "https://example.com/path/to/some/very/long/resource";
    expect(truncateUrl(url60chars)).toHaveLength(50);
    expect(truncateUrl(url60chars)).toContain("...");
  });

  it("should handle edge case where URL equals maxLength", () => {
    const url = "https://example.com";
    expect(truncateUrl(url, url.length)).toBe(url);
  });
});

describe("calculateScore", () => {
  it("should return 1 when value is at or below good threshold", () => {
    expect(calculateScore(100, 200, 500)).toBe(1);
    expect(calculateScore(200, 200, 500)).toBe(1);
  });

  it("should return 0 when value is at or above poor threshold", () => {
    expect(calculateScore(500, 200, 500)).toBe(0);
    expect(calculateScore(600, 200, 500)).toBe(0);
  });

  it("should return interpolated value between thresholds", () => {
    // Midpoint between 200 and 500 should give 0.5
    expect(calculateScore(350, 200, 500)).toBe(0.5);
    // Quarter point should give 0.75
    expect(calculateScore(275, 200, 500)).toBe(0.75);
    // Three-quarter point should give 0.25
    expect(calculateScore(425, 200, 500)).toBe(0.25);
  });
});

describe("getSeverityByBytes", () => {
  it("should return minor for small byte sizes", () => {
    expect(getSeverityByBytes(0)).toBe("minor");
    expect(getSeverityByBytes(50000)).toBe("minor");
    expect(getSeverityByBytes(99999)).toBe("minor");
  });

  it("should return moderate for medium byte sizes", () => {
    expect(getSeverityByBytes(100000)).toBe("moderate");
    expect(getSeverityByBytes(200000)).toBe("moderate");
    expect(getSeverityByBytes(299999)).toBe("moderate");
  });

  it("should return serious for large byte sizes", () => {
    expect(getSeverityByBytes(300000)).toBe("serious");
    expect(getSeverityByBytes(400000)).toBe("serious");
    expect(getSeverityByBytes(499999)).toBe("serious");
  });

  it("should return critical for very large byte sizes", () => {
    expect(getSeverityByBytes(500000)).toBe("critical");
    expect(getSeverityByBytes(1000000)).toBe("critical");
  });

  it("should respect custom thresholds", () => {
    expect(getSeverityByBytes(50, 100, 200, 300)).toBe("minor");
    expect(getSeverityByBytes(150, 100, 200, 300)).toBe("moderate");
    expect(getSeverityByBytes(250, 100, 200, 300)).toBe("serious");
    expect(getSeverityByBytes(350, 100, 200, 300)).toBe("critical");
  });
});

describe("getSeverityByTime", () => {
  it("should return minor for short times", () => {
    expect(getSeverityByTime(0)).toBe("minor");
    expect(getSeverityByTime(100)).toBe("minor");
    expect(getSeverityByTime(299)).toBe("minor");
  });

  it("should return moderate for medium times", () => {
    expect(getSeverityByTime(300)).toBe("moderate");
    expect(getSeverityByTime(500)).toBe("moderate");
    expect(getSeverityByTime(799)).toBe("moderate");
  });

  it("should return serious for longer times", () => {
    expect(getSeverityByTime(800)).toBe("serious");
    expect(getSeverityByTime(1000)).toBe("serious");
    expect(getSeverityByTime(1499)).toBe("serious");
  });

  it("should return critical for very long times", () => {
    expect(getSeverityByTime(1500)).toBe("critical");
    expect(getSeverityByTime(3000)).toBe("critical");
  });

  it("should respect custom thresholds", () => {
    expect(getSeverityByTime(50, 100, 200, 300)).toBe("minor");
    expect(getSeverityByTime(150, 100, 200, 300)).toBe("moderate");
    expect(getSeverityByTime(250, 100, 200, 300)).toBe("serious");
    expect(getSeverityByTime(350, 100, 200, 300)).toBe("critical");
  });
});
