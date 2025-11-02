/**
 * User commands
 * CLI operations for JIRA users
 */

import { Command } from 'commander';
import { loadConfig } from '../../utils/config.js';
import { JiraClient } from '../../core/client.js';
import { UserService } from '../../services/user.service.js';
import {
  printUser,
  printUsers,
  printError,
  type OutputFormat,
} from '../utils/output.js';

export async function userCommand(): Promise<Command> {
  const config = await loadConfig();
  const client = new JiraClient(config);
  const userService = new UserService(client);

  const user = new Command('user').description('Manage JIRA users');

  // Get user by identifier (email or account ID)
  user
    .command('get <identifier>')
    .description('Get user by email or account ID')
    .option('-j, --json', 'Output in JSON format')
    .action(async (identifier: string, options) => {
      try {
        const result = await userService.getUserByIdentifier(identifier);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printUser(result, format);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get user ${identifier}`, error);
        }
        process.exit(1);
      }
    });

  // Search users
  user
    .command('search <query>')
    .description('Search users by name or email')
    .option('-m, --max <number>', 'Maximum results', '50')
    .option('-j, --json', 'Output in JSON format')
    .action(async (query: string, options) => {
      try {
        const maxResults = parseInt(options.max, 10);
        const results = await userService.searchUsers(query, maxResults);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printUsers(results, format);
      } catch (error) {
        if (error instanceof Error) {
          printError('Failed to search users', error);
        }
        process.exit(1);
      }
    });

  // Find assignable users for projects
  user
    .command('assignable <projectKeys...>')
    .description('Find users assignable to projects')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKeys: string[], options) => {
      try {
        const results = await userService.findAssignableUsersForProjects(projectKeys);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printUsers(results, format);
      } catch (error) {
        if (error instanceof Error) {
          printError('Failed to find assignable users', error);
        }
        process.exit(1);
      }
    });

  // Resolve email to account ID
  user
    .command('resolve <identifier>')
    .description('Resolve email or identifier to account ID')
    .action(async (identifier: string) => {
      try {
        const accountId = await userService.resolveToAccountId(identifier);
        console.log(accountId);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to resolve ${identifier}`, error);
        }
        process.exit(1);
      }
    });

  return user;
}
