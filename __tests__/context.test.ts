/**
 * Tests for Project Context Detector
 */

import {
  ProjectContextDetector,
  createContextDetector,
  detectProjectContext,
} from "../src/context";

// Mock fs and path modules
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Get the mocked fs
import * as fs from "fs";
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("ProjectContextDetector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no package.json found
    mockedFs.existsSync.mockReturnValue(false);
  });

  describe("constructor", () => {
    it("should create instance with default project root", () => {
      const detector = new ProjectContextDetector();
      expect(detector).toBeInstanceOf(ProjectContextDetector);
    });

    it("should create instance with custom project root", () => {
      const detector = new ProjectContextDetector("/custom/path");
      expect(detector).toBeInstanceOf(ProjectContextDetector);
    });
  });

  describe("detect with no package.json", () => {
    it("should return minimal context when package.json not found", async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework).toBeNull();
      expect(context.packageManager).toBe("npm");
      expect(context.isTypeScript).toBe(false);
      expect(context.dependencies.total).toBe(0);
    });
  });

  describe("detect Next.js", () => {
    it("should detect Next.js 14 with app router", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          name: "my-next-app",
          dependencies: {
            next: "14.0.0",
            react: "18.2.0",
          },
          devDependencies: {
            typescript: "5.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.name).toBe("my-next-app");
      expect(context.framework?.name).toBe("next");
      expect(context.framework?.version).toBe("14.0.0");
      expect(context.framework?.routerType).toBe("app");
      expect(context.framework?.renderingMode).toBe("hybrid");
      expect(context.isTypeScript).toBe(true);
    });

    it("should detect Next.js 12 with pages router", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "12.3.0",
            react: "18.2.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("next");
      expect(context.framework?.routerType).toBe("pages");
    });

    it("should detect Next.js with next-auth feature", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
            react: "18.2.0",
            "next-auth": "4.24.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.features).toContain("auth");
    });

    it("should detect Next.js with i18n feature", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
            react: "18.2.0",
            "next-intl": "3.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.features).toContain("i18n");
    });
  });

  describe("detect other frameworks", () => {
    it("should detect Nuxt", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            nuxt: "3.8.0",
            vue: "3.3.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("nuxt");
      expect(context.framework?.routerType).toBe("file-based");
    });

    it("should detect Remix", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@remix-run/react": "2.0.0",
            react: "18.2.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("remix");
      expect(context.framework?.renderingMode).toBe("ssr");
    });

    it("should detect Gatsby", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            gatsby: "5.12.0",
            react: "18.2.0",
            "gatsby-plugin-image": "3.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("gatsby");
      expect(context.framework?.renderingMode).toBe("ssg");
      expect(context.framework?.features).toContain("image-optimization");
    });

    it("should detect Astro", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            astro: "4.0.0",
            "@astrojs/react": "3.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("astro");
      expect(context.framework?.features).toContain("react");
    });

    it("should detect SvelteKit", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            "@sveltejs/kit": "2.0.0",
            svelte: "4.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("svelte");
      expect(context.framework?.routerType).toBe("file-based");
    });

    it("should detect Vue standalone", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            vue: "3.3.0",
            "vue-router": "4.2.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("vue");
      expect(context.framework?.routerType).toBe("config-based");
      expect(context.framework?.renderingMode).toBe("spa");
    });

    it("should detect Angular", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@angular/core": "17.0.0",
            "@angular/platform-server": "17.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("angular");
      expect(context.framework?.renderingMode).toBe("ssr");
    });

    it("should detect standalone React", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            react: "18.2.0",
            "react-dom": "18.2.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.framework?.name).toBe("react");
      expect(context.framework?.renderingMode).toBe("spa");
    });
  });

  describe("detect package manager", () => {
    it("should detect npm from packageManager field", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          packageManager: "npm@10.0.0",
          dependencies: {},
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.packageManager).toBe("npm");
    });

    it("should detect pnpm from packageManager field", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          packageManager: "pnpm@8.10.0",
          dependencies: {},
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.packageManager).toBe("pnpm");
    });

    it("should detect yarn from packageManager field", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          packageManager: "yarn@4.0.0",
          dependencies: {},
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.packageManager).toBe("yarn");
    });

    it("should detect bun from packageManager field", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          packageManager: "bun@1.0.0",
          dependencies: {},
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.packageManager).toBe("bun");
    });
  });

  describe("detect build tool", () => {
    it("should detect Vite", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            vite: "5.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.buildTool).toBe("vite");
    });

    it("should detect webpack", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            webpack: "5.89.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.buildTool).toBe("webpack");
    });

    it("should detect esbuild (standalone)", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            esbuild: "0.19.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.buildTool).toBe("esbuild");
    });
  });

  describe("detect CSS solution", () => {
    it("should detect Tailwind CSS", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            tailwindcss: "3.3.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.cssSolution).toBe("tailwind");
    });

    it("should detect styled-components", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "styled-components": "6.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.cssSolution).toBe("styled-components");
    });

    it("should detect Emotion", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@emotion/react": "11.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.cssSolution).toBe("emotion");
    });

    it("should detect Sass", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            sass: "1.69.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.cssSolution).toBe("sass");
    });
  });

  describe("detect TypeScript", () => {
    it("should detect TypeScript from typescript dependency", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            typescript: "5.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.isTypeScript).toBe(true);
    });

    it("should detect TypeScript from @types/node", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            "@types/node": "20.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.isTypeScript).toBe(true);
    });

    it("should detect TypeScript from @types/react", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          devDependencies: {
            "@types/react": "18.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.isTypeScript).toBe(true);
    });
  });

  describe("detect image optimization", () => {
    it("should detect next/image for Next.js projects", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.imageOptimization).toBe("next/image");
    });

    it("should detect sharp", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            sharp: "0.32.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.imageOptimization).toBe("sharp");
    });

    it("should detect cloudinary", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            cloudinary: "1.41.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.imageOptimization).toBe("cloudinary");
    });
  });

  describe("detect analytics", () => {
    it("should detect Vercel Analytics", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@vercel/analytics": "1.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.analytics).toContain("Vercel Analytics");
    });

    it("should detect multiple analytics providers", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@vercel/analytics": "1.0.0",
            "react-ga4": "2.0.0",
            "posthog-js": "1.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.analytics).toContain("Vercel Analytics");
      expect(context.analytics).toContain("Google Analytics");
      expect(context.analytics).toContain("PostHog");
    });
  });

  describe("detect third-party integrations", () => {
    it("should detect Auth0", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@auth0/nextjs-auth0": "3.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.thirdPartyIntegrations).toContain("Auth0");
    });

    it("should detect Prisma", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@prisma/client": "5.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.thirdPartyIntegrations).toContain("Prisma");
    });

    it("should detect Supabase", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@supabase/supabase-js": "2.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.thirdPartyIntegrations).toContain("Supabase");
    });

    it("should detect Stripe", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@stripe/stripe-js": "2.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.thirdPartyIntegrations).toContain("Stripe");
    });
  });

  describe("detect UI library", () => {
    it("should detect Radix UI", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@radix-ui/react-dialog": "1.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.uiLibrary).toBe("Radix UI");
    });

    it("should detect Chakra UI", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@chakra-ui/react": "2.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.uiLibrary).toBe("Chakra UI");
    });

    it("should detect Material UI", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            "@mui/material": "5.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.uiLibrary).toBe("Material UI");
    });
  });

  describe("dependencies tracking", () => {
    it("should track production and development dependencies", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {
            next: "14.0.0",
            react: "18.2.0",
          },
          devDependencies: {
            typescript: "5.0.0",
            jest: "29.0.0",
          },
        })
      );

      const detector = new ProjectContextDetector("/test/project");
      const context = await detector.detect();

      expect(context.dependencies.production).toContain("next");
      expect(context.dependencies.production).toContain("react");
      expect(context.dependencies.development).toContain("typescript");
      expect(context.dependencies.development).toContain("jest");
      expect(context.dependencies.total).toBe(4);
    });
  });
});

describe("createContextDetector", () => {
  it("should create detector instance", () => {
    const detector = createContextDetector("/test/path");
    expect(detector).toBeInstanceOf(ProjectContextDetector);
  });

  it("should work without path argument", () => {
    const detector = createContextDetector();
    expect(detector).toBeInstanceOf(ProjectContextDetector);
  });
});

describe("detectProjectContext", () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(false);
  });

  it("should return context from detection", async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        name: "test-app",
        dependencies: {
          react: "18.2.0",
        },
      })
    );

    const context = await detectProjectContext("/test/project");

    expect(context.name).toBe("test-app");
    expect(context.framework?.name).toBe("react");
  });

  it("should work without path argument", async () => {
    const context = await detectProjectContext();

    expect(context).toBeDefined();
    expect(context.packageManager).toBe("npm");
  });
});
