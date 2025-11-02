/**
 * CLI output formatting utilities
 * Provides table rendering, JSON export, and colorized output
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import type { User } from '../../models/user.js';
import type { Issue } from '../../models/issue.js';
import type { Project, ProjectVersion, IssueType } from '../../models/project.js';

/**
 * Output format options
 */
export type OutputFormat = 'table' | 'json' | 'compact';

/**
 * Format and print user as table
 */
export function printUser(user: User, format: OutputFormat = 'table'): void {
  if (format === 'json') {
    console.log(JSON.stringify(user, null, 2));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Field'), chalk.cyan('Value')],
    colWidths: [20, 60],
  });

  table.push(
    ['Account ID', user.accountId],
    ['Display Name', chalk.bold(user.displayName)],
    ['Email', user.emailAddress],
    ['Account Type', user.accountType],
    ['Active', user.active ? chalk.green('Yes') : chalk.red('No')],
    ['Time Zone', user.timeZone],
    ['Locale', user.locale]
  );

  console.log(table.toString());
}

/**
 * Format and print users as table
 */
export function printUsers(users: User[], format: OutputFormat = 'table'): void {
  if (format === 'json') {
    console.log(JSON.stringify(users, null, 2));
    return;
  }

  if (users.length === 0) {
    console.log(chalk.yellow('No users found'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('Display Name'),
      chalk.cyan('Email'),
      chalk.cyan('Account ID'),
      chalk.cyan('Active'),
    ],
    colWidths: [30, 40, 30, 10],
  });

  users.forEach((user) => {
    table.push([
      chalk.bold(user.displayName),
      user.emailAddress,
      user.accountId,
      user.active ? chalk.green('✓') : chalk.red('✗'),
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${users.length} user(s)`));
}

/**
 * Format and print issue as table
 */
export function printIssue(issue: Issue, format: OutputFormat = 'table'): void {
  if (format === 'json') {
    console.log(JSON.stringify(issue, null, 2));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Field'), chalk.cyan('Value')],
    colWidths: [20, 80],
  });

  const statusColor = getStatusColor(issue.fields.status.statusCategory.key);

  table.push(
    ['Key', chalk.bold.yellow(issue.key)],
    ['Summary', chalk.bold(issue.fields.summary)],
    ['Status', chalk[statusColor](issue.fields.status.name)],
    ['Type', issue.fields.issuetype.name],
    ['Project', `${issue.fields.project.name} (${issue.fields.project.key})`],
    ['Reporter', issue.fields.reporter.displayName],
    [
      'Assignee',
      issue.fields.assignee ? issue.fields.assignee.displayName : chalk.gray('Unassigned'),
    ],
    [
      'Priority',
      issue.fields.priority ? issue.fields.priority.name : chalk.gray('None'),
    ],
    ['Labels', issue.fields.labels.join(', ') || chalk.gray('None')],
    ['Created', new Date(issue.fields.created).toLocaleString()],
    ['Updated', new Date(issue.fields.updated).toLocaleString()]
  );

  console.log(table.toString());
}

/**
 * Format and print issues as table
 */
export function printIssues(issues: Issue[], format: OutputFormat = 'table'): void {
  if (format === 'json') {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  if (issues.length === 0) {
    console.log(chalk.yellow('No issues found'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('Key'),
      chalk.cyan('Summary'),
      chalk.cyan('Status'),
      chalk.cyan('Assignee'),
      chalk.cyan('Type'),
    ],
    colWidths: [15, 40, 20, 25, 15],
  });

  issues.forEach((issue) => {
    const statusColor = getStatusColor(issue.fields.status.statusCategory.key);
    table.push([
      chalk.bold.yellow(issue.key),
      truncate(issue.fields.summary, 38),
      chalk[statusColor](issue.fields.status.name),
      issue.fields.assignee
        ? truncate(issue.fields.assignee.displayName, 23)
        : chalk.gray('Unassigned'),
      issue.fields.issuetype.name,
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${issues.length} issue(s)`));
}

/**
 * Format and print project as table
 */
export function printProject(project: Project, format: OutputFormat = 'table'): void {
  if (format === 'json') {
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Field'), chalk.cyan('Value')],
    colWidths: [20, 60],
  });

  table.push(
    ['Key', chalk.bold.yellow(project.key)],
    ['Name', chalk.bold(project.name)],
    ['Description', project.description || chalk.gray('None')],
    ['Project Type', project.projectTypeKey],
    ['Lead', project.lead.displayName],
    ['Issue Types', project.issueTypes.map((t) => t.name).join(', ')]
  );

  console.log(table.toString());
}

/**
 * Format and print project versions as table
 */
export function printVersions(
  versions: ProjectVersion[],
  format: OutputFormat = 'table'
): void {
  if (format === 'json') {
    console.log(JSON.stringify(versions, null, 2));
    return;
  }

  if (versions.length === 0) {
    console.log(chalk.yellow('No versions found'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Released'),
      chalk.cyan('Archived'),
      chalk.cyan('Release Date'),
    ],
    colWidths: [30, 15, 15, 20],
  });

  versions.forEach((version) => {
    table.push([
      chalk.bold(version.name),
      version.released ? chalk.green('Yes') : chalk.yellow('No'),
      version.archived ? chalk.red('Yes') : chalk.green('No'),
      version.releaseDate || chalk.gray('Not set'),
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${versions.length} version(s)`));
}

/**
 * Format and print issue types as table
 */
export function printIssueTypes(
  issueTypes: IssueType[],
  format: OutputFormat = 'table'
): void {
  if (format === 'json') {
    console.log(JSON.stringify(issueTypes, null, 2));
    return;
  }

  if (issueTypes.length === 0) {
    console.log(chalk.yellow('No issue types found'));
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Name'), chalk.cyan('Description'), chalk.cyan('Subtask')],
    colWidths: [20, 50, 10],
  });

  issueTypes.forEach((type) => {
    table.push([
      chalk.bold(type.name),
      truncate(type.description, 48),
      type.subtask ? chalk.green('Yes') : chalk.gray('No'),
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${issueTypes.length} type(s)`));
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Print error message
 */
export function printError(message: string, error?: Error): void {
  console.error(chalk.red('✗'), message);
  if (error && process.env.DEBUG) {
    console.error(chalk.gray(error.stack));
  }
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Get color for status category
 */
function getStatusColor(
  categoryKey: string
): 'green' | 'yellow' | 'blue' | 'gray' | 'red' {
  switch (categoryKey.toLowerCase()) {
    case 'done':
      return 'green';
    case 'indeterminate':
      return 'yellow';
    case 'new':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

/**
 * Print JSON output
 */
export function printJSON(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}
