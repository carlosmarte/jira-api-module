/**
 * Configuration command
 * Interactive setup for JIRA credentials and settings
 */

import { Command } from 'commander';
import { saveConfig } from '../../utils/config.js';
import { promptForConfig } from '../utils/prompts.js';
import { printSuccess, printError, printInfo } from '../utils/output.js';

export const configureCommand = new Command('configure')
  .description('Configure JIRA API credentials')
  .action(async () => {
    try {
      printInfo('JIRA API Configuration');
      console.log('');
      console.log('This wizard will help you set up your JIRA API credentials.');
      console.log('You\'ll need:');
      console.log('  1. Your JIRA Cloud instance URL');
      console.log('  2. Your email address');
      console.log('  3. An API token (generate at: https://id.atlassian.com/manage-profile/security/api-tokens)');
      console.log('');

      const config = await promptForConfig();

      // Save config (non-sensitive data only)
      await saveConfig({
        baseUrl: config.baseUrl!,
        email: config.email!,
      });

      console.log('');
      printSuccess('Configuration saved successfully!');
      console.log('');
      console.log('IMPORTANT: Set your API token as an environment variable:');
      console.log('  export JIRA_API_TOKEN="your-api-token"');
      console.log('');
      console.log('Or add it to your shell profile (~/.bashrc, ~/.zshrc, etc.)');
      console.log('');
      printInfo('You can now use other commands like "jira-api issue list"');
    } catch (error) {
      if (error instanceof Error) {
        printError('Configuration failed', error);
      }
      process.exit(1);
    }
  });
