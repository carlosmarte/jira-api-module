/**
 * Project commands
 * CLI operations for JIRA projects
 */

import { Command } from 'commander';
import { loadConfig } from '../../utils/config.js';
import { JiraClient } from '../../core/client.js';
import { ProjectService } from '../../services/project.service.js';
import {
  printProject,
  printVersions,
  printIssueTypes,
  printSuccess,
  printError,
  type OutputFormat,
} from '../utils/output.js';
import { input } from '../utils/prompts.js';

export async function projectCommand(): Promise<Command> {
  const config = await loadConfig();
  const client = new JiraClient(config);
  const projectService = new ProjectService(client);

  const project = new Command('project').description('Manage JIRA projects');

  // Get project
  project
    .command('get <key>')
    .description('Get project details')
    .option('-j, --json', 'Output in JSON format')
    .action(async (key: string, options) => {
      try {
        const result = await projectService.getProject(key);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printProject(result, format);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get project ${key}`, error);
        }
        process.exit(1);
      }
    });

  // List project versions
  project
    .command('versions <projectKey>')
    .description('List project versions')
    .option('-r, --released', 'Show only released versions')
    .option('-u, --unreleased', 'Show only unreleased versions')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKey: string, options) => {
      try {
        let results;
        if (options.released) {
          results = await projectService.getReleasedVersions(projectKey);
        } else if (options.unreleased) {
          results = await projectService.getUnreleasedVersions(projectKey);
        } else {
          results = await projectService.getProjectVersions(projectKey);
        }

        const format: OutputFormat = options.json ? 'json' : 'table';
        printVersions(results, format);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get versions for ${projectKey}`, error);
        }
        process.exit(1);
      }
    });

  // Create version
  project
    .command('create-version <projectKey> <name>')
    .description('Create a new version')
    .option('-d, --description <description>', 'Version description')
    .option('--release-date <date>', 'Release date (YYYY-MM-DD)')
    .option('-i, --interactive', 'Use interactive prompts')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKey: string, name: string, options) => {
      try {
        let description: string | undefined;
        let releaseDate: string | undefined;

        if (options.interactive) {
          description = await input('Version description (optional):');
          releaseDate = await input('Release date YYYY-MM-DD (optional):');
        } else {
          description = options.description;
          releaseDate = options.releaseDate;
        }

        const result = await projectService.createVersion(projectKey, {
          name,
          description: description || undefined,
          releaseDate: releaseDate || undefined,
        });

        printSuccess(`Version created: ${result.name}`);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`\nVersion Details:`);
          console.log(`  Name: ${result.name}`);
          console.log(`  ID: ${result.id}`);
          if (result.description) {
            console.log(`  Description: ${result.description}`);
          }
          if (result.releaseDate) {
            console.log(`  Release Date: ${result.releaseDate}`);
          }
          console.log('');
        }
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to create version in ${projectKey}`, error);
        }
        process.exit(1);
      }
    });

  // List issue types
  project
    .command('issue-types <projectKey>')
    .description('List project issue types')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKey: string, options) => {
      try {
        const results = await projectService.getIssueTypes(projectKey);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printIssueTypes(results, format);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get issue types for ${projectKey}`, error);
        }
        process.exit(1);
      }
    });

  // Check if issue type exists
  project
    .command('has-issue-type <projectKey> <typeName>')
    .description('Check if issue type exists in project')
    .action(async (projectKey: string, typeName: string) => {
      try {
        const exists = await projectService.issueTypeExists(projectKey, typeName);
        if (exists) {
          printSuccess(`Issue type "${typeName}" exists in ${projectKey}`);
        } else {
          console.log(`Issue type "${typeName}" does not exist in ${projectKey}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to check issue type in ${projectKey}`, error);
        }
        process.exit(1);
      }
    });

  return project;
}
