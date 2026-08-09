import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type SkillRegistryEntry = {
  command: string;
  source: 'standard' | 'custom';
  absolutePath: string;
  runtimePath: string;
};

type RuntimeBlockOptions = {
  runtimeLabel: string;
  registry: SkillRegistryEntry[];
};

const GENERATED_START = '<!-- BEGIN GENERATED SKILL ROUTER -->';
const GENERATED_END = '<!-- END GENERATED SKILL ROUTER -->';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDirectory, '..');

const normalizeSlashes = (value: string) => value.replace(/\\/g, '/');

const ensureCommandShape = (command: string, context: string) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(command)) {
    throw new Error(`${context} must use only lowercase letters, numbers, and hyphens. Received "${command}".`);
  }
};

const readJsonFile = (filePath: string, repoRoot: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${normalizeSlashes(path.relative(repoRoot, filePath))}: ${message}`);
  }
};

const collectStandardSkills = (repoRoot: string): SkillRegistryEntry[] => {
  const skillsRoot = path.join(repoRoot, '.agents', 'skills');
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Skills directory not found: ${normalizeSlashes(path.relative(repoRoot, skillsRoot))}`);
  }

  const categoryEntries = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const registry: SkillRegistryEntry[] = [];

  for (const categoryEntry of categoryEntries) {
    const categoryPath = path.join(skillsRoot, categoryEntry.name);
    const skillEntries = fs.readdirSync(categoryPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());

    for (const skillEntry of skillEntries) {
      const skillPath = path.join(categoryPath, skillEntry.name);
      const skillFilePath = path.join(skillPath, 'SKILL.md');

      if (!fs.existsSync(skillFilePath)) {
        throw new Error(
          `Skill folder "${categoryEntry.name}/${skillEntry.name}" is missing SKILL.md.`
        );
      }

      ensureCommandShape(skillEntry.name, `Skill folder "${categoryEntry.name}/${skillEntry.name}"`);

      registry.push({
        command: skillEntry.name,
        source: 'standard',
        absolutePath: skillFilePath,
        runtimePath: normalizeSlashes(path.relative(repoRoot, skillFilePath)),
      });
    }
  }

  return registry;
};

const collectCustomSkills = (repoRoot: string): SkillRegistryEntry[] => {
  const customRegistryPath = path.join(repoRoot, '.agents', 'skills.json');
  if (!fs.existsSync(customRegistryPath)) {
    return [];
  }

  const parsed = readJsonFile(customRegistryPath, repoRoot);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { skills?: unknown[] }).skills)) {
    throw new Error(`Expected ${normalizeSlashes(path.relative(repoRoot, customRegistryPath))} to contain a "skills" array.`);
  }

  return (parsed as { skills: Array<{ command?: unknown; path?: unknown }> }).skills.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Custom skill entry ${index + 1} in .agents/skills.json must be an object.`);
    }

    if (typeof entry.command !== 'string' || entry.command.trim() === '') {
      throw new Error(`Custom skill entry ${index + 1} in .agents/skills.json must include a non-empty "command" string.`);
    }

    if (typeof entry.path !== 'string' || entry.path.trim() === '') {
      throw new Error(`Custom skill entry ${index + 1} in .agents/skills.json must include a non-empty "path" string.`);
    }

    const command = entry.command.trim();
    ensureCommandShape(command, `Custom skill command "${command}"`);

    const absolutePath = path.isAbsolute(entry.path)
      ? path.normalize(entry.path)
      : path.resolve(repoRoot, entry.path);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Custom skill command "${command}" points to a missing file: ${normalizeSlashes(entry.path)}`);
    }

    return {
      command,
      source: 'custom' as const,
      absolutePath,
      runtimePath: normalizeSlashes(path.isAbsolute(entry.path) ? path.relative(repoRoot, absolutePath) : entry.path),
    };
  });
};

export const collectSkillRegistry = (repoRoot: string): SkillRegistryEntry[] => {
  const registry = [...collectStandardSkills(repoRoot), ...collectCustomSkills(repoRoot)].sort((left, right) =>
    left.command.localeCompare(right.command)
  );

  const seen = new Map<string, SkillRegistryEntry>();
  for (const entry of registry) {
    const previous = seen.get(entry.command);
    if (previous) {
      throw new Error(
        `Duplicate skill command "${entry.command}" found at "${previous.runtimePath}" and "${entry.runtimePath}". Rename one of them before syncing.`
      );
    }
    seen.set(entry.command, entry);
  }

  return registry;
};

const renderRegistryLines = (registry: SkillRegistryEntry[]) =>
  registry.map((entry) => `- \`/${entry.command}\` -> \`${entry.runtimePath}\``).join('\n');

export const renderGeneratedRouterBlock = ({ runtimeLabel, registry }: RuntimeBlockOptions) => [
  `## Generated Exact Skill Router (${runtimeLabel})`,
  '',
  '_This block is generated by `pnpm run sync-skills`. Edit the manual sections outside the markers if you need repo-specific notes._',
  '',
  '### Contract',
  '',
  '- Exact-only repo-local skill routing. Do not auto-activate repo-local skills from keywords, intent, or fuzzy matching.',
  '- Only parse leading slash commands at the very start of the prompt.',
  '- Only parse standalone slash commands while they remain in the leading command block.',
  '- The leading command block may be inline on one line or split across consecutive lines.',
  '- Stop parsing commands as soon as the first non-command text begins. Everything after that is the actual request.',
  '- Accept only exact child-folder command names in the form `/<skill-name>`.',
  '- Load each valid repo-local skill file in first-appearance order.',
  '- If the same valid command is repeated, load it once and ignore later duplicates.',
  '- Unknown slash commands must be reported explicitly to the user.',
  '- If both valid and invalid commands appear together, still load the valid skills and explicitly report the invalid ones.',
  '- If there are no valid leading slash commands, do not auto-load any repo-local skills from this registry.',
  '',
  '### Registry',
  '',
  renderRegistryLines(registry),
  '',
  '### Parsing Examples',
  '',
  '- Valid inline block: `/seo /context-engineering fix this page`',
  '- Valid multiline block:',
  '  `/seo`',
  '  `/context-engineering`',
  '  `fix this page`',
  '- Invalid mid-prompt usage: `Please /seo fix this page`',
].join('\n');

export const upsertGeneratedBlock = (originalContents: string, generatedBlock: string) => {
  const trimmedOriginal = originalContents.trimEnd();
  const nextBlock = [GENERATED_START, generatedBlock, GENERATED_END].join('\n');

  if (trimmedOriginal.includes(GENERATED_START) && trimmedOriginal.includes(GENERATED_END)) {
    const pattern = new RegExp(
      `${GENERATED_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${GENERATED_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'm'
    );
    return `${trimmedOriginal.replace(pattern, nextBlock)}\n`;
  }

  if (trimmedOriginal.length === 0) {
    return `${nextBlock}\n`;
  }

  return `${trimmedOriginal}\n\n${nextBlock}\n`;
};

export const prepareRuntimeFileContents = (
  currentContents: string,
  generatedBlock: string,
  fallbackContents: string
) => {
  const hasGeneratedMarkers =
    currentContents.includes(GENERATED_START) && currentContents.includes(GENERATED_END);
  const baseContents = hasGeneratedMarkers ? currentContents : fallbackContents;
  return upsertGeneratedBlock(baseContents, generatedBlock);
};

const ensureParentDirectory = (filePath: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const syncRuntimeFile = (filePath: string, generatedBlock: string, fallbackContents: string) => {
  const currentContents = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : fallbackContents;
  const nextContents = prepareRuntimeFileContents(currentContents, generatedBlock, fallbackContents);
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, nextContents, 'utf8');
};

const runtimeFallback = (label: string) => `# ${label}

Manual notes for ${label} may live above or below the generated block.
`;

export const syncSkillRouters = (repoRoot: string) => {
  const registry = collectSkillRegistry(repoRoot);

  syncRuntimeFile(
    path.join(repoRoot, 'CLAUDE.md'),
    renderGeneratedRouterBlock({ runtimeLabel: 'Claude Code in Antigravity', registry }),
    runtimeFallback('Claude Project Instructions')
  );

  syncRuntimeFile(
    path.join(repoRoot, '.agents', 'AGENTS.md'),
    renderGeneratedRouterBlock({ runtimeLabel: 'Codex', registry }),
    runtimeFallback('Codex Project Instructions')
  );

  syncRuntimeFile(
    path.join(repoRoot, '.agents', 'gemini-skills', 'gemini-master-skill.md'),
    renderGeneratedRouterBlock({ runtimeLabel: 'Gemini and Antigravity', registry }),
    runtimeFallback('Gemini Skill Router')
  );

  return registry;
};

const isDirectExecution = () => {
  const entryPath = process.argv[1];
  if (!entryPath) return false;
  return pathToFileURL(path.resolve(entryPath)).href === import.meta.url;
};

if (isDirectExecution()) {
  const registry = syncSkillRouters(defaultRepoRoot);
  process.stdout.write(`Synced ${registry.length} repo-local skill commands.\n`);
}
