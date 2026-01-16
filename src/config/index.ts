import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, statSync } from "fs";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

dotenv.config();

// --- Determine Project Root ---
/**
 * Finds the project root directory by searching upwards for package.json.
 * @param startDir The directory to start searching from.
 * @returns The absolute path to the project root, or throws an error if not found.
 */
const findProjectRoot = (startDir: string): string => {
  let currentDir = startDir;
  while (true) {
    const packageJsonPath = join(currentDir, "package.json");
    if (existsSync(packageJsonPath)) {
      return currentDir;
    }
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached the root of the filesystem without finding package.json
      throw new Error(
        `Could not find project root (package.json) starting from ${startDir}`,
      );
    }
    currentDir = parentDir;
  }
};

let projectRoot: string;
try {
  // For ESM, __dirname is not available directly.
  const currentModuleDir = dirname(fileURLToPath(import.meta.url));
  projectRoot = findProjectRoot(currentModuleDir);
} catch (error: any) {
  console.error(`FATAL: Error determining project root: ${error.message}`);
  projectRoot = process.cwd();
  console.warn(
    `Warning: Using process.cwd() (${projectRoot}) as fallback project root.`,
  );
}
// --- End Determine Project Root ---

const pkgPath = join(projectRoot, "package.json");
let pkg = { name: "obsidian-mcp-server", version: "0.0.0" };

try {
  pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
} catch (error) {
  if (process.stderr.isTTY) {
    console.error(
      "Warning: Could not read package.json for default config values. Using hardcoded defaults.",
      error,
    );
  }
}

/**
 * Zod schema for validating environment variables.
 * @private
 */
const EnvSchema = z.object({
  MCP_SERVER_NAME: z.string().optional(),
  MCP_SERVER_VERSION: z.string().optional(),
  MCP_LOG_LEVEL: z.string().default("info"),
  LOGS_DIR: z.string().default(path.join(projectRoot, "logs")),
  NODE_ENV: z.string().default("development"),
  MCP_TRANSPORT_TYPE: z.enum(["stdio", "http"]).default("stdio"),
  MCP_HTTP_PORT: z.coerce.number().int().positive().default(3010),
  MCP_HTTP_HOST: z.string().default("127.0.0.1"),
  MCP_ALLOWED_ORIGINS: z.string().optional(),
  MCP_AUTH_MODE: z.enum(["jwt", "oauth"]).optional(),
  MCP_AUTH_SECRET_KEY: z
    .string()
    .min(
      32,
      "MCP_AUTH_SECRET_KEY must be at least 32 characters long for security",
    )
    .optional(),
  OAUTH_ISSUER_URL: z.string().url().optional(),
  OAUTH_AUDIENCE: z.string().optional(),
  OAUTH_JWKS_URI: z.string().url().optional(),
  // --- Obsidian Specific Config ---
  OBSIDIAN_API_KEY: z.string().min(1, "OBSIDIAN_API_KEY cannot be empty"),
  OBSIDIAN_BASE_URL: z.string().url().default("http://127.0.0.1:27123"),
  OBSIDIAN_VERIFY_SSL: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("false"),
  OBSIDIAN_VAULT_PATH: z
    .string()
    .min(1, "OBSIDIAN_VAULT_PATH cannot be empty")
    .optional(),
  OBSIDIAN_CACHE_REFRESH_INTERVAL_MIN: z.coerce
    .number()
    .int()
    .positive()
    .default(10),
  OBSIDIAN_ENABLE_CACHE: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("true"),
  OBSIDIAN_API_SEARCH_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30000),
  // --- CDP Config ---
  OBSIDIAN_CDP_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("false"),
  OBSIDIAN_CDP_HOST: z.string().default("localhost"),
  OBSIDIAN_CDP_PORT: z.coerce.number().int().positive().default(9222),
  // --- Safety Config ---
  WRITE_MODE: z.enum(["off", "safe", "confirm", "full"]).default("safe"),
  BACKUP_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("true"),
  BACKUP_DIR: z.string().default(path.join(projectRoot, "backups")),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  OPERATION_LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  AGENT_QUERY_WINDOW_HOURS: z.coerce.number().int().positive().default(168),
  CONFLICT_DETECTION: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("true"),
  SYNC_AWARE_WRITES: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("true"),
  SYNC_BUFFER_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMITING_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("false"),
  PROTECTED_PATTERNS: z.string().default(""),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errorDetails = parsedEnv.error.flatten().fieldErrors;
  if (process.stderr.isTTY) {
    console.error("❌ Invalid environment variables:", errorDetails);
  }
  throw new Error(
    `Invalid environment configuration. Please check your .env file or environment variables. Details: ${JSON.stringify(errorDetails)}`,
  );
}

const env = parsedEnv.data;

// --- Directory Ensurance Function ---
const ensureDirectory = (
  dirPath: string,
  rootDir: string,
  dirName: string,
): string | null => {
  const resolvedDirPath = path.isAbsolute(dirPath)
    ? dirPath
    : path.resolve(rootDir, dirPath);

  if (
    !resolvedDirPath.startsWith(rootDir + path.sep) &&
    resolvedDirPath !== rootDir
  ) {
    if (process.stderr.isTTY) {
      console.error(
        `Error: ${dirName} path "${dirPath}" resolves to "${resolvedDirPath}", which is outside the project boundary "${rootDir}".`,
      );
    }
    return null;
  }

  if (!existsSync(resolvedDirPath)) {
    try {
      mkdirSync(resolvedDirPath, { recursive: true });
    } catch (err: unknown) {
      if (process.stderr.isTTY) {
        console.error(
          `Error creating ${dirName} directory at ${resolvedDirPath}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return null;
    }
  } else {
    try {
      if (!statSync(resolvedDirPath).isDirectory()) {
        if (process.stderr.isTTY) {
          console.error(
            `Error: ${dirName} path ${resolvedDirPath} exists but is not a directory.`,
          );
        }
        return null;
      }
    } catch (statError: any) {
      if (process.stderr.isTTY) {
        console.error(
          `Error accessing ${dirName} path ${resolvedDirPath}: ${statError.message}`,
        );
      }
      return null;
    }
  }
  return resolvedDirPath;
};
// --- End Directory Ensurance Function ---

const validatedLogsPath = ensureDirectory(env.LOGS_DIR, projectRoot, "logs");

if (!validatedLogsPath) {
  if (process.stderr.isTTY) {
    console.error(
      "FATAL: Logs directory configuration is invalid or could not be created. Please check permissions and path. Exiting.",
    );
  }
  process.exit(1);
}

/**
 * Main application configuration object.
 */
export const config = {
  pkg,
  mcpServerName: env.MCP_SERVER_NAME || pkg.name,
  mcpServerVersion: env.MCP_SERVER_VERSION || pkg.version,
  logLevel: env.MCP_LOG_LEVEL,
  logsPath: validatedLogsPath,
  environment: env.NODE_ENV,
  mcpTransportType: env.MCP_TRANSPORT_TYPE,
  mcpHttpPort: env.MCP_HTTP_PORT,
  mcpHttpHost: env.MCP_HTTP_HOST,
  mcpAllowedOrigins: env.MCP_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mcpAuthMode: env.MCP_AUTH_MODE,
  mcpAuthSecretKey: env.MCP_AUTH_SECRET_KEY,
  oauthIssuerUrl: env.OAUTH_ISSUER_URL,
  oauthAudience: env.OAUTH_AUDIENCE,
  oauthJwksUri: env.OAUTH_JWKS_URI,
  obsidianApiKey: env.OBSIDIAN_API_KEY,
  obsidianBaseUrl: env.OBSIDIAN_BASE_URL,
  obsidianVerifySsl: env.OBSIDIAN_VERIFY_SSL,
  obsidianVaultPath: env.OBSIDIAN_VAULT_PATH,
  obsidianCacheRefreshIntervalMin: env.OBSIDIAN_CACHE_REFRESH_INTERVAL_MIN,
  obsidianEnableCache: env.OBSIDIAN_ENABLE_CACHE,
  obsidianApiSearchTimeoutMs: env.OBSIDIAN_API_SEARCH_TIMEOUT_MS,
  // CDP Config
  obsidianCdpEnabled: env.OBSIDIAN_CDP_ENABLED,
  obsidianCdpHost: env.OBSIDIAN_CDP_HOST,
  obsidianCdpPort: env.OBSIDIAN_CDP_PORT,
  // Safety Config
  writeMode: env.WRITE_MODE,
  backupEnabled: env.BACKUP_ENABLED,
  backupDir: env.BACKUP_DIR,
  backupRetentionDays: env.BACKUP_RETENTION_DAYS,
  operationLogRetentionDays: env.OPERATION_LOG_RETENTION_DAYS,
  agentQueryWindowHours: env.AGENT_QUERY_WINDOW_HOURS,
  conflictDetection: env.CONFLICT_DETECTION,
  syncAwareWrites: env.SYNC_AWARE_WRITES,
  syncBufferSeconds: env.SYNC_BUFFER_SECONDS,
  rateLimitingEnabled: env.RATE_LIMITING_ENABLED,
  protectedPatterns: env.PROTECTED_PATTERNS.split(",")
    .map((p) => p.trim())
    .filter(Boolean),
};

/**
 * The configured logging level for the application.
 * Exported separately for convenience (e.g., logger initialization).
 * @type {string}
 */
export const logLevel = config.logLevel;

/**
 * The configured runtime environment for the application.
 * Exported separately for convenience.
 * @type {string}
 */
export const environment = config.environment;
