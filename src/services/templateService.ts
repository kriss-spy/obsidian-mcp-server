import { promises as fs } from "fs";
import path from "path";
import { logger, RequestContext, requestContextService } from "../utils/index.js";

/**
 * Represents a folder-to-template mapping from the Templater plugin configuration.
 */
interface FolderTemplateMapping {
  folder: string;
  template: string;
}

/**
 * Represents the Templater plugin configuration structure.
 */
interface TemplaterConfig {
  templates_folder: string;
  enable_folder_templates: boolean;
  folder_templates: FolderTemplateMapping[];
  enable_file_templates: boolean;
  file_templates: Array<{ regex: string; template: string }>;
}

/**
 * Template variable replacement context.
 * Can include common variables like {{title}}, {{date}}, etc.
 */
interface TemplateVariables {
  title?: string;
  date?: string;
  time?: string;
  datetime?: string;
  [key: string]: string | undefined;
}

/**
 * Service for managing Obsidian templates, specifically integrating with
 * the Templater plugin's configuration for folder-based templates.
 */
export class TemplateService {
  private vaultPath: string;
  private templaterConfig: TemplaterConfig | null = null;
  private configLoadPromise: Promise<void> | null = null;
  private templatesFolder: string = "";

  /**
   * Creates a new TemplateService instance.
   *
   * @param {string} vaultPath - The absolute path to the Obsidian vault.
   */
  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.configLoadPromise = this.loadTemplaterConfig();
  }

  /**
   * Loads the Templater plugin configuration from the vault.
   * Caches the configuration for subsequent calls.
   *
   * @private
   * @returns {Promise<void>}
   */
   private async loadTemplaterConfig(): Promise<void> {
    const context = requestContextService.createRequestContext({
      operation: "loadTemplaterConfig",
    });

    try {
      const configPath = path.join(
        this.vaultPath,
        ".obsidian",
        "plugins",
        "templater-obsidian",
        "data.json",
      );

      logger.debug(`Loading Templater config from: ${configPath}`, context);

      const configContent = await fs.readFile(configPath, "utf-8");
      this.templaterConfig = JSON.parse(configContent);

      if (this.templaterConfig?.templates_folder) {
        this.templatesFolder = path.join(
          this.vaultPath,
          this.templaterConfig.templates_folder,
        );
      }

      logger.info(
        `Templater config loaded. Folder templates: ${this.templaterConfig?.enable_folder_templates ? "enabled" : "disabled"}`,
        context,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warning(
        `Could not load Templater config: ${errorMsg}. Template support will be disabled.`,
        { ...context, error: errorMsg },
      );
      this.templaterConfig = null;
    }
  }

  /**
   * Ensures the Templater configuration is loaded before proceeding.
   * Uses a cached promise to prevent concurrent loads.
   *
   * @private
   * @returns {Promise<void>}
   */
  private async ensureConfigLoaded(): Promise<void> {
    if (this.configLoadPromise) {
      await this.configLoadPromise;
      this.configLoadPromise = null;
    }
  }

  /**
   * Finds the appropriate template for a given file path based on
   * folder template mappings.
   *
   * @param {string} filePath - The vault-relative path to the file being created.
   * @returns {Promise<string | null>} The vault-relative path to the template file, or null if no template is found.
   */
  async findTemplateForPath(filePath: string): Promise<string | null> {
    const context = requestContextService.createRequestContext({
      operation: "findTemplateForPath",
      filePath,
    });

    await this.ensureConfigLoaded();

    if (
      !this.templaterConfig ||
      !this.templaterConfig.enable_folder_templates ||
      !this.templaterConfig.folder_templates ||
      this.templaterConfig.folder_templates.length === 0
    ) {
      logger.debug(
        `Folder templates not enabled or no mappings available`,
        context,
      );
      return null;
    }

    const dirPath = path.dirname(filePath);

    logger.debug(
      `Searching for template for path: ${filePath} (directory: ${dirPath})`,
      context,
    );

    for (const mapping of this.templaterConfig.folder_templates) {
      const templateFolder = mapping.folder.trim();
      const templateFile = mapping.template.trim();

      logger.debug(`Checking mapping: folder="${templateFolder}", template="${templateFile}"`, context);

      if (dirPath === templateFolder || dirPath.startsWith(`${templateFolder}/`)) {
        logger.info(`Found template for ${filePath}: ${templateFile}`, context);
        return templateFile;
      }
    }

    logger.debug(`No template found for path: ${filePath}`, context);
    return null;
  }

  /**
   * Reads a template file from the vault.
   *
   * @param {string} templatePath - The vault-relative path to the template file.
   * @returns {Promise<string>} The content of the template file.
   * @throws {Error} If the template file cannot be read.
   */
  async readTemplate(templatePath: string): Promise<string> {
    const context = requestContextService.createRequestContext({
      operation: "readTemplate",
      templatePath,
    });

    const absolutePath = path.join(this.vaultPath, templatePath);

    logger.debug(`Reading template from: ${absolutePath}`, context);

    try {
      const content = await fs.readFile(absolutePath, "utf-8");
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to read template: ${errorMsg}`, { ...context, error });
      throw new Error(`Failed to read template file: ${errorMsg}`);
    }
  }

  /**
   * Replaces template variables in the template content.
   * Supports common variables like {{title}}, {{date}}, {{time}}, etc.
   *
   * @param {string} templateContent - The raw template content.
   * @param {TemplateVariables} variables - Variables to replace in the template.
   * @returns {string} The template content with variables replaced.
   */
  replaceVariables(templateContent: string, variables: TemplateVariables): string {
    let content = templateContent;

    const now = new Date();
    const defaultVariables: TemplateVariables = {
      title: variables.title || "Untitled",
      date: variables.date || now.toISOString().split("T")[0],
      time: variables.time || now.toTimeString().split(" ")[0].slice(0, 5),
      datetime: variables.datetime || now.toISOString(),
      ...variables,
    };

    for (const [key, value] of Object.entries(defaultVariables)) {
      if (value !== undefined) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        content = content.replace(regex, value);
      }
    }

    return content;
  }

  /**
   * Gets the template content for a given file path with variables replaced.
   *
   * @param {string} filePath - The vault-relative path to the file being created.
   * @param {TemplateVariables} variables - Variables to replace in the template.
   * @returns {Promise<string | null>} The template content with variables replaced, or null if no template is found.
   */
  async getTemplateContent(
    filePath: string,
    variables: TemplateVariables = {},
  ): Promise<string | null> {
    const context = requestContextService.createRequestContext({
      operation: "getTemplateContent",
      filePath,
    });

    const templatePath = await this.findTemplateForPath(filePath);

    if (!templatePath) {
      return null;
    }

    try {
      const templateContent = await this.readTemplate(templatePath);
      const replacedContent = this.replaceVariables(templateContent, variables);

      logger.info(
        `Successfully applied template for ${filePath}`,
        { ...context, templatePath },
      );

      return replacedContent;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `Failed to apply template for ${filePath}: ${errorMsg}`,
        { ...context, error: errorMsg },
      );
      return null;
    }
  }

  /**
   * Checks if template support is available.
   *
   * @returns {Promise<boolean>} True if template support is available, false otherwise.
   */
  async isAvailable(): Promise<boolean> {
    await this.ensureConfigLoaded();
    return (
      this.templaterConfig !== null &&
      this.templaterConfig.enable_folder_templates
    );
  }
}
