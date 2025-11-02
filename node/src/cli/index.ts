/**
 * CLI entry point
 * Main command-line interface for JIRA API operations
 */

import { Command } from 'commander';
import { loadConfig } from '../utils/config.js';
import { JiraClient } from '../core/client.js';
import { UserService } from '../services/user.service.js';
import { IssueService } from '../services/issue.service.js';
import { ProjectService } from '../services/project.service.js';
import { printError } from './utils/output.js';
import { configureCommand } from './commands/configure.js';
import { issueCommand } from './commands/issue.js';
import { userCommand } from './commands/user.js';
import { projectCommand } from './commands/project.js';

const program = new Command();

program
  .name('jira-api')
  .description('CLI for JIRA Cloud API v3 operations')
  .version('1.0.0');

// Global options
program.option('-j, --json', 'Output in JSON format');
program.option('--debug', 'Enable debug output');

// Configuration command (doesn't require JIRA client)
program.addCommand(configureCommand);

// Initialize services for other commands
async function initializeServices() {
  try {
    const config = await loadConfig();
    const client = new JiraClient(config);
    const userService = new UserService(client);
    const issueService = new IssueService(client, userService);
    const projectService = new ProjectService(client);

    return { client, userService, issueService, projectService };
  } catch (error) {
    if (error instanceof Error) {
      printError('Failed to initialize JIRA client', error);
      console.error('\nPlease run "jira-api configure" to set up your configuration.');
    }
    process.exit(1);
  }
}

// Add service-dependent commands
(async () => {
  try {
    // Issue commands
    program.addCommand(await issueCommand());

    // User commands
    program.addCommand(await userCommand());

    // Project commands
    program.addCommand(await projectCommand());

    // Parse arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      printError('Command failed', error);
    }
    process.exit(1);
  }
})();

// Export for testing
export { program, initializeServices };
