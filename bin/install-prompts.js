#!/usr/bin/env node

/**
 * @silverassist/performance-toolkit - Prompt & Skills Installer
 *
 * Creates symbolic links from your project to the performance-toolkit
 * prompts and skills, ensuring they stay updated automatically.
 *
 * Usage:
 *   npx perf-prompts install           # Install prompts (symlink)
 *   npx perf-prompts install --skills  # Install agent skills too
 *   npx perf-prompts install -c        # Copy instead of symlink
 *   npx perf-prompts uninstall         # Remove installed prompts/skills
 *   npx perf-prompts status            # Check installation status
 *
 * @module @silverassist/performance-toolkit/install-prompts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

const log = (msg, color = "reset") =>
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
const success = (msg) => log(`✅ ${msg}`, "green");
const warn = (msg) => log(`⚠️  ${msg}`, "yellow");
const error = (msg) => log(`❌ ${msg}`, "red");
const info = (msg) => log(`ℹ️  ${msg}`, "cyan");

/**
 * Detect if running from a temporary npx cache (not installed in node_modules)
 * @returns {{ isTemporary: boolean, installedPath: string | null }}
 */
function detectInstallationContext() {
  const packageRoot = path.resolve(__dirname, "..");

  // Check if we're in a node_modules directory (properly installed)
  const isInNodeModules = packageRoot.includes("node_modules");

  // Check for common npx cache patterns
  const isNpxCache =
    packageRoot.includes("/_npx/") ||
    packageRoot.includes("\\_npx\\") ||
    packageRoot.includes("/.npm/_npx") ||
    packageRoot.includes("npx-") ||
    packageRoot.includes("/tmp/") ||
    packageRoot.includes("\\Temp\\");

  // If in node_modules and not in npx cache, it's properly installed
  if (isInNodeModules && !isNpxCache) {
    return { isTemporary: false, installedPath: packageRoot };
  }

  // Try to find if package is installed in the project's node_modules
  const projectRoot = findProjectRoot();
  const localInstallPath = path.join(
    projectRoot,
    "node_modules",
    "@silverassist",
    "performance-toolkit",
  );

  if (fs.existsSync(localInstallPath)) {
    return { isTemporary: false, installedPath: localInstallPath };
  }

  // Running from npx temporary cache without local installation
  return { isTemporary: true, installedPath: null };
}

/**
 * Get the path to the prompts directory in the installed package
 * @param {string | null} overridePath - Optional path to use instead of __dirname
 */
function getPackagePromptsPath(overridePath = null) {
  const basePath = overridePath || path.resolve(__dirname, "..");
  return path.resolve(basePath, "src", ".github", "prompts");
}

/**
 * Get the path to the skills directory in the installed package
 * @param {string | null} overridePath - Optional path to use instead of __dirname
 */
function getPackageSkillsPath(overridePath = null) {
  const basePath = overridePath || path.resolve(__dirname, "..");
  return path.resolve(basePath, "src", ".github", "skills");
}

/**
 * Get the target directory for prompts in the user's project
 */
function getTargetDir(projectRoot) {
  return path.resolve(projectRoot, ".github", "prompts");
}

/**
 * Get the target paths for skills in the user's project
 */
function getSkillsTargetPaths(projectRoot, packageSkillsPath) {
  const skillDirs = fs.readdirSync(packageSkillsPath).filter((f) => {
    const fullPath = path.join(packageSkillsPath, f);
    return fs.statSync(fullPath).isDirectory();
  });

  return skillDirs.map((skillName) => ({
    name: skillName,
    source: path.join(packageSkillsPath, skillName),
    target: path.resolve(projectRoot, ".github", "skills", skillName),
  }));
}

/**
 * Find the project root by looking for package.json
 */
function findProjectRoot() {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return process.cwd();
}

/**
 * Recursively copy a directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Check if a path is a symbolic link pointing to our prompts
 */
function isOurSymlink(targetPath, packagePromptsPath) {
  try {
    if (!fs.existsSync(targetPath)) return false;
    const stats = fs.lstatSync(targetPath);
    if (!stats.isSymbolicLink()) return false;

    const linkTarget = fs.readlinkSync(targetPath);
    const resolvedTarget = path.resolve(path.dirname(targetPath), linkTarget);
    return resolvedTarget === packagePromptsPath;
  } catch {
    return false;
  }
}

/**
 * Get list of prompt files and directories to install
 */
function getInstallableItems(packagePromptsPath) {
  const items = fs.readdirSync(packagePromptsPath, { withFileTypes: true });
  const promptFiles = [];
  const directories = [];

  for (const item of items) {
    if (item.isDirectory()) {
      directories.push(item.name);
    } else if (item.name.endsWith(".prompt.md")) {
      promptFiles.push(item.name);
    }
  }

  return { promptFiles, directories };
}

/**
 * Check if any of our prompts are already installed
 */
function checkExistingInstallation(targetDir, packagePromptsPath) {
  const { promptFiles, directories } = getInstallableItems(packagePromptsPath);
  const existing = [];

  // Check prompt files
  for (const file of promptFiles) {
    const targetPath = path.join(targetDir, file);
    if (fs.existsSync(targetPath)) {
      existing.push({ type: "file", name: file, path: targetPath });
    }
  }

  // Check directories
  for (const dir of directories) {
    const targetPath = path.join(targetDir, dir);
    if (fs.existsSync(targetPath)) {
      existing.push({ type: "directory", name: dir, path: targetPath });
    }
  }

  return existing;
}

/**
 * Install prompts and optionally skills (symlink or copy)
 */
function install(options = {}) {
  let { copy = false, force = false, skills = false } = options;
  const projectRoot = findProjectRoot();
  const context = detectInstallationContext();
  const targetDir = getTargetDir(projectRoot);

  let packagePromptsPath;
  let effectiveInstallPath;

  // Check if we're installing into the package's own development directory
  // This happens when running the script directly during development
  const packageDir = path.resolve(__dirname, "..");
  const isSameDirectory = projectRoot === packageDir;

  if (isSameDirectory) {
    const packageJsonPath = path.join(packageDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkg.name === "@silverassist/performance-toolkit") {
          error("Cannot install prompts into the package's own repository.");
          info("This command is meant to be run in a separate project.");
          info("");
          info("To test, run from a different project:");
          console.log("  cd /path/to/your-project");
          console.log("  npx perf-prompts install");
          process.exit(1);
        }
      } catch {}
    }
  }

  if (context.isTemporary) {
    // Running from npx without local installation
    console.log("");
    warn("Running from npx without package installed in project.");
    console.log("");

    if (!copy) {
      warn("Symlinks require the package to be installed locally.");
      warn(
        "Symlinks to temporary npx cache would break when cache is cleared.",
      );
      console.log("");
      info("Options:");
      console.log("  1. Install the package first, then run this command:");
      console.log("     npm install @silverassist/performance-toolkit");
      console.log("     npx perf-prompts install");
      console.log("");
      console.log(
        "  2. Or use --copy to copy files instead (won't auto-update):",
      );
      console.log("     npx perf-prompts install --copy");
      console.log("");

      const response =
        process.argv.includes("--yes") || process.argv.includes("-y");
      if (!response) {
        info("Automatically using --copy mode for npx execution.");
        copy = true;
      }
    }

    // Use the temporary path for copying
    packagePromptsPath = getPackagePromptsPath();
    effectiveInstallPath = path.resolve(__dirname, "..");
  } else {
    // Package is properly installed
    effectiveInstallPath = context.installedPath;
    packagePromptsPath = getPackagePromptsPath(effectiveInstallPath);
  }

  // Verify package prompts exist
  if (!fs.existsSync(packagePromptsPath)) {
    error(`Package prompts not found at: ${packagePromptsPath}`);
    error(
      "This might be a package installation issue. Try reinstalling the package.",
    );
    process.exit(1);
  }

  info(`Project root: ${projectRoot}`);
  info(`Package prompts: ${packagePromptsPath}`);
  info(`Target location: ${targetDir}`);
  if (!context.isTemporary) {
    info(`Install type: ${copy ? "copy" : "symlink"}`);
  }
  console.log("");

  // Create .github/prompts directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    info(`Created directory: ${targetDir}`);
  }

  // Get items to install
  const { promptFiles, directories } = getInstallableItems(packagePromptsPath);

  // Check for existing installations
  const existing = checkExistingInstallation(targetDir, packagePromptsPath);

  if (existing.length > 0 && !force) {
    warn("Some prompts or directories already exist:");
    existing.forEach((item) => {
      console.log(`  • ${item.name} (${item.type})`);
    });
    console.log("");
    warn("Use --force to replace them, or remove them manually first.");
    process.exit(1);
  }

  // Remove existing items if force is enabled
  if (force && existing.length > 0) {
    info("Removing existing items...");
    for (const item of existing) {
      const stats = fs.lstatSync(item.path);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(item.path);
      } else if (stats.isDirectory()) {
        fs.rmSync(item.path, { recursive: true });
      } else {
        fs.unlinkSync(item.path);
      }
    }
    info("Existing items removed");
  }

  let installedCount = 0;

  // Install prompt files
  for (const file of promptFiles) {
    const sourcePath = path.join(packagePromptsPath, file);
    const targetPath = path.join(targetDir, file);

    if (copy) {
      fs.copyFileSync(sourcePath, targetPath);
      installedCount++;
    } else {
      const relativePath = path.relative(targetDir, sourcePath);
      fs.symlinkSync(relativePath, targetPath, "file");
      installedCount++;
    }
  }

  // Install directories (_partials, etc.)
  for (const dir of directories) {
    const sourcePath = path.join(packagePromptsPath, dir);
    const targetPath = path.join(targetDir, dir);

    if (copy) {
      copyDirectory(sourcePath, targetPath);
    } else {
      const relativePath = path.relative(targetDir, sourcePath);
      fs.symlinkSync(relativePath, targetPath, "dir");
    }
  }

  console.log("");
  if (copy) {
    success(`${installedCount} prompt files copied to: ${targetDir}`);
    if (directories.length > 0) {
      success(
        `${directories.length} directories copied: ${directories.join(", ")}`,
      );
    }
    warn("Note: Copied prompts won't auto-update when the package is updated.");
    warn(
      "Run 'npx perf-prompts install' again after updates, or use symlinks instead.",
    );
  } else {
    success(`${installedCount} prompt files symlinked to: ${targetDir}`);
    if (directories.length > 0) {
      success(
        `${directories.length} directories symlinked: ${directories.join(", ")}`,
      );
    }
    info("Prompts will auto-update when you update the package!");
  }

  console.log("");
  success("Prompts installation complete!");
  console.log("");
  log("Available prompts:", "cyan");

  promptFiles.forEach((p) => {
    const name = p.replace(".prompt.md", "");
    console.log(`  • ${name}`);
  });

  // Install skills if requested
  if (skills) {
    console.log("");
    log("Installing Agent Skills...", "cyan");
    console.log("");

    const packageSkillsPath = getPackageSkillsPath(effectiveInstallPath);

    if (!fs.existsSync(packageSkillsPath)) {
      warn("Skills directory not found in package");
    } else {
      const skillTargets = getSkillsTargetPaths(projectRoot, packageSkillsPath);
      const skillsDir = path.resolve(projectRoot, ".github", "skills");

      // Create skills directory if needed
      if (!fs.existsSync(skillsDir)) {
        fs.mkdirSync(skillsDir, { recursive: true });
      }

      for (const skill of skillTargets) {
        // Check if skill already exists
        if (fs.existsSync(skill.target)) {
          if (!force) {
            warn(
              `Skill '${skill.name}' already exists, skipping (use --force to replace)`,
            );
            continue;
          }
          const stats = fs.lstatSync(skill.target);
          if (stats.isSymbolicLink()) {
            fs.unlinkSync(skill.target);
          } else {
            fs.rmSync(skill.target, { recursive: true });
          }
        }

        if (copy) {
          copyDirectory(skill.source, skill.target);
          success(`Skill '${skill.name}' copied`);
        } else {
          const relativePath = path.relative(skillsDir, skill.source);
          fs.symlinkSync(relativePath, skill.target, "dir");
          success(`Skill '${skill.name}' linked`);
        }
      }

      console.log("");
      log("Available skills:", "cyan");
      skillTargets.forEach((s) => {
        console.log(`  • ${s.name}`);
      });

      console.log("");
      info("Skills are loaded automatically by Copilot when relevant.");
      info("Enable with: chat.useAgentSkills setting in VS Code.");
    }
  }

  console.log("");
  success("Installation complete!");
  console.log("");
  log("Usage in VS Code:", "cyan");
  console.log("  @workspace /analyze-performance https://your-site.com");
  console.log("  @workspace /optimize-lcp");
  console.log("  @workspace /nextjs-performance");

  if (!skills) {
    console.log("");
    info(
      "Tip: Add --skills to also install Agent Skills (auto-loaded by Copilot)",
    );
    console.log("  npx perf-prompts install --skills");
  }
}

/**
 * Uninstall prompts and skills
 */
function uninstall(options = {}) {
  const { skills = false } = options;
  const projectRoot = findProjectRoot();
  const targetDir = getTargetDir(projectRoot);

  let removedPrompts = false;
  let removedSkills = false;

  // Get the package prompts path to know what we installed
  const context = detectInstallationContext();
  const effectiveInstallPath = context.installedPath || path.resolve(__dirname, "..");
  const packagePromptsPath = getPackagePromptsPath(effectiveInstallPath);

  if (fs.existsSync(packagePromptsPath)) {
    const { promptFiles, directories } = getInstallableItems(packagePromptsPath);

    // Remove prompt files
    for (const file of promptFiles) {
      const targetPath = path.join(targetDir, file);
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          fs.unlinkSync(targetPath);
        }
        removedPrompts = true;
      }
    }

    // Remove directories
    for (const dir of directories) {
      const targetPath = path.join(targetDir, dir);
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          fs.rmSync(targetPath, { recursive: true });
        }
        removedPrompts = true;
      }
    }
  } else {
    // Fallback: remove known prompt files if package prompts not found
    warn("Package prompts not found, attempting to remove common prompt files");
    const knownPrompts = [
      "analyze-performance.prompt.md",
      "detect-context.prompt.md",
      "nextjs-performance.prompt.md",
      "optimize-bundle.prompt.md",
      "optimize-lcp.prompt.md",
      "performance-audit.prompt.md",
    ];
    const knownDirs = ["_partials"];

    for (const file of knownPrompts) {
      const targetPath = path.join(targetDir, file);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        removedPrompts = true;
      }
    }

    for (const dir of knownDirs) {
      const targetPath = path.join(targetDir, dir);
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          fs.rmSync(targetPath, { recursive: true });
        }
        removedPrompts = true;
      }
    }
  }

  if (removedPrompts) {
    success("Prompts removed");
  }

  // Remove skills if requested
  if (skills) {
    const skillsDir = path.resolve(projectRoot, ".github", "skills");
    const ourSkills = ["nextjs-performance", "web-performance-analysis"];

    for (const skillName of ourSkills) {
      const skillPath = path.join(skillsDir, skillName);
      if (fs.existsSync(skillPath)) {
        const stats = fs.lstatSync(skillPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(skillPath);
        } else {
          fs.rmSync(skillPath, { recursive: true });
        }
        success(`Skill '${skillName}' removed`);
        removedSkills = true;
      }
    }
  }

  if (!removedPrompts && !removedSkills) {
    info("Nothing to remove (prompts/skills not installed)");
    return;
  }

  success("Uninstallation complete!");
}

/**
 * Check installation status
 */
function status() {
  const projectRoot = findProjectRoot();
  const context = detectInstallationContext();
  const targetDir = getTargetDir(projectRoot);

  // Get the correct prompts path based on installation context
  const packagePromptsPath = context.installedPath
    ? getPackagePromptsPath(context.installedPath)
    : getPackagePromptsPath();

  console.log("");
  log("Performance Toolkit Prompts Status", "cyan");
  console.log("─".repeat(40));
  console.log("");

  console.log(`Project root:     ${projectRoot}`);
  console.log(`Target location:  ${targetDir}`);
  console.log("");

  // Show package installation status
  if (context.isTemporary) {
    warn("Package: NOT INSTALLED (running from npx cache)");
    info("Symlinks will not work without package installation.");
    info("Install with: npm install @silverassist/performance-toolkit");
  } else {
    success(`Package: INSTALLED at ${context.installedPath}`);
    console.log(`Prompts source: ${packagePromptsPath}`);
  }
  console.log("");

  if (!fs.existsSync(targetDir)) {
    warn("Prompts Status: NOT INSTALLED (directory doesn't exist)");
    console.log("");
    if (context.isTemporary) {
      info("Run 'npx perf-prompts install --copy' to copy prompts");
      info("Or install the package first for symlink support");
    } else {
      info("Run 'npx perf-prompts install' to install prompts");
    }
    return;
  }

  // Check for installed prompt files
  const { promptFiles } = fs.existsSync(packagePromptsPath)
    ? getInstallableItems(packagePromptsPath)
    : { promptFiles: [], directories: [] };

  const installedPrompts = [];
  const installedSymlinks = [];
  const installedCopies = [];

  for (const file of promptFiles) {
    const targetPath = path.join(targetDir, file);
    if (fs.existsSync(targetPath)) {
      installedPrompts.push(file);
      const stats = fs.lstatSync(targetPath);
      if (stats.isSymbolicLink()) {
        installedSymlinks.push(file);
      } else {
        installedCopies.push(file);
      }
    }
  }

  if (installedPrompts.length === 0) {
    warn("Prompts Status: NOT INSTALLED");
    console.log("");
    if (context.isTemporary) {
      info("Run 'npx perf-prompts install --copy' to copy prompts");
      info("Or install the package first for symlink support");
    } else {
      info("Run 'npx perf-prompts install' to install prompts");
    }
    return;
  }

  if (installedSymlinks.length === installedPrompts.length) {
    success(`Prompts Status: INSTALLED (${installedPrompts.length} symlinked) ✓`);
    info("Prompts will auto-update when the package is updated");
  } else if (installedCopies.length === installedPrompts.length) {
    warn(`Prompts Status: INSTALLED (${installedPrompts.length} copied)`);
    info("Prompts won't auto-update. Re-run install after package updates.");
  } else {
    warn(
      `Prompts Status: MIXED (${installedSymlinks.length} symlinked, ${installedCopies.length} copied)`,
    );
  }

  console.log("");
  log("Installed prompts:", "cyan");

  for (const file of installedPrompts) {
    const name = file.replace(".prompt.md", "");
    const targetPath = path.join(targetDir, file);
    const stats = fs.lstatSync(targetPath);
    const type = stats.isSymbolicLink() ? "symlink" : "copied";
    console.log(`  • ${name} (${type})`);
  }

  // Check skills status
  console.log("");
  log("Skills Status:", "cyan");

  const skillsDir = path.resolve(projectRoot, ".github", "skills");
  const ourSkills = ["nextjs-performance", "web-performance-analysis"];
  let hasSkills = false;

  for (const skillName of ourSkills) {
    const skillPath = path.join(skillsDir, skillName);
    if (fs.existsSync(skillPath)) {
      hasSkills = true;
      const stats = fs.lstatSync(skillPath);
      if (stats.isSymbolicLink()) {
        success(`  • ${skillName} (symlink)`);
      } else {
        warn(`  • ${skillName} (copied)`);
      }
    }
  }

  if (!hasSkills) {
    info("  No performance skills installed");
    info("  Install with: npx perf-prompts install --skills");
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
📦 @silverassist/performance-toolkit - Prompt & Skills Installer

Usage: npx perf-prompts <command> [options]

Commands:
  install      Install prompts (and optionally skills) to your project
  uninstall    Remove installed prompts and skills
  status       Check installation status

Options:
  --skills, -s   Also install Agent Skills (auto-loaded by Copilot)
  --copy, -c     Copy files instead of creating symlinks
  --force, -f    Overwrite existing installation
  --help, -h     Show this help message

Examples:
  npx perf-prompts install             # Install prompts with symlinks
  npx perf-prompts install --skills    # Install prompts + Agent Skills
  npx perf-prompts install --copy      # Copy files instead of symlinks
  npx perf-prompts install --force     # Replace existing installation
  npx perf-prompts uninstall --skills  # Remove prompts and skills
  npx perf-prompts status              # Check current status

Prompts vs Skills:
  • Prompts (.prompt.md) - Manually invoked with @workspace /[prompt-name]
  • Skills (SKILL.md) - Auto-loaded by Copilot when relevant

Why symlinks?
  Symlinks ensure prompts/skills stay up-to-date automatically when you
  update the @silverassist/performance-toolkit package. Use --copy to
  customize them locally.
`);
}

// Parse arguments
const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("-")) || "help";
const flags = {
  copy: args.includes("--copy") || args.includes("-c"),
  force: args.includes("--force") || args.includes("-f"),
  skills: args.includes("--skills") || args.includes("-s"),
  help: args.includes("--help") || args.includes("-h"),
};

// Execute command
if (flags.help || command === "help") {
  showHelp();
} else if (command === "install") {
  install({ copy: flags.copy, force: flags.force, skills: flags.skills });
} else if (command === "uninstall") {
  uninstall({ skills: flags.skills });
} else if (command === "status") {
  status();
} else {
  error(`Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}
