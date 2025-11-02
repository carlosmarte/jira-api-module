/**
 * CLI interactive prompts
 * Provides user input collection for configuration and commands
 */

import inquirer from 'inquirer';
import type { Config } from '../../utils/config.js';

/**
 * Prompt for JIRA configuration
 */
export async function promptForConfig(): Promise<Partial<Config>> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'JIRA Base URL (e.g., https://your-domain.atlassian.net):',
      validate: (input: string) => {
        if (!input) return 'Base URL is required';
        if (!input.startsWith('http')) return 'URL must start with http:// or https://';
        return true;
      },
    },
    {
      type: 'input',
      name: 'email',
      message: 'Your JIRA email address:',
      validate: (input: string) => {
        if (!input) return 'Email is required';
        if (!input.includes('@')) return 'Invalid email address';
        return true;
      },
    },
    {
      type: 'password',
      name: 'apiToken',
      message: 'API Token (generate at https://id.atlassian.com/manage-profile/security/api-tokens):',
      mask: '*',
      validate: (input: string) => {
        if (!input) return 'API token is required';
        return true;
      },
    },
  ]);

  return {
    baseUrl: answers.baseUrl as string,
    email: answers.email as string,
    apiToken: answers.apiToken as string,
  };
}

/**
 * Confirm action
 */
export async function confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);

  return answer.confirmed as boolean;
}

/**
 * Select from list
 */
export async function select<T>(
  message: string,
  choices: Array<{ name: string; value: T }>
): Promise<T> {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
    },
  ]);

  return answer.selected as T;
}

/**
 * Input text
 */
export async function input(
  message: string,
  defaultValue?: string,
  validate?: (input: string) => boolean | string
): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return answer.value as string;
}

/**
 * Input multiple lines (for descriptions)
 */
export async function inputMultiline(message: string): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: 'editor',
      name: 'value',
      message,
    },
  ]);

  return answer.value as string;
}
