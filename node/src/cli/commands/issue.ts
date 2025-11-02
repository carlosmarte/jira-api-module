/**
 * Issue commands
 * CLI operations for JIRA issues
 */

import { Command } from 'commander';
import { loadConfig } from '../../utils/config.js';
import { JiraClient } from '../../core/client.js';
import { UserService } from '../../services/user.service.js';
import { IssueService } from '../../services/issue.service.js';
import {
  printIssue,
  printIssues,
  printSuccess,
  printError,
  printInfo,
  type OutputFormat,
} from '../utils/output.js';
import { confirm, input, inputMultiline } from '../utils/prompts.js';
import type { IssueCreateInput } from '../../services/issue.service.js';

export async function issueCommand(): Promise<Command> {
  const config = await loadConfig();
  const client = new JiraClient(config);
  const userService = new UserService(client);
  const issueService = new IssueService(client, userService);

  const issue = new Command('issue').description('Manage JIRA issues');

  // Get issue
  issue
    .command('get <key>')
    .description('Get issue details')
    .option('-j, --json', 'Output in JSON format')
    .action(async (key: string, options) => {
      try {
        const result = await issueService.getIssue(key);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printIssue(result, format);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get issue ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Search issues
  issue
    .command('search <jql>')
    .description('Search issues with JQL query')
    .option('-m, --max <number>', 'Maximum results', '50')
    .option('-j, --json', 'Output in JSON format')
    .action(async (jql: string, options) => {
      try {
        const maxResults = parseInt(options.max, 10);
        const results = await issueService.searchIssues(jql, maxResults);
        const format: OutputFormat = options.json ? 'json' : 'table';
        printIssues(results, format);
      } catch (error) {
        if (error instanceof Error) {
          printError('Failed to search issues', error);
        }
        process.exit(1);
      }
    });

  // Create issue
  issue
    .command('create <projectKey> <type>')
    .description('Create a new issue')
    .option('-s, --summary <summary>', 'Issue summary')
    .option('-d, --description <description>', 'Issue description')
    .option('-a, --assignee <email>', 'Assignee email address')
    .option('-l, --labels <labels>', 'Comma-separated labels')
    .option('-i, --interactive', 'Use interactive prompts')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKey: string, type: string, options) => {
      try {
        let summary: string;
        let description: string | undefined;
        let assigneeEmail: string | undefined;
        let labels: string[] = [];

        if (options.interactive) {
          summary = await input('Issue summary:');
          const addDesc = await confirm('Add description?', false);
          if (addDesc) {
            description = await inputMultiline('Issue description:');
          }
          const addAssignee = await confirm('Assign to someone?', false);
          if (addAssignee) {
            assigneeEmail = await input('Assignee email:');
          }
          const addLabels = await confirm('Add labels?', false);
          if (addLabels) {
            const labelsInput = await input('Labels (comma-separated):');
            labels = labelsInput.split(',').map((l) => l.trim());
          }
        } else {
          if (!options.summary) {
            printError('Summary is required. Use -s or --interactive flag');
            process.exit(1);
          }
          summary = options.summary;
          description = options.description;
          assigneeEmail = options.assignee;
          if (options.labels) {
            labels = options.labels.split(',').map((l: string) => l.trim());
          }
        }

        const issueData: IssueCreateInput = {
          projectKey,
          issueTypeName: type,
          summary,
          description,
          assigneeEmail,
          labels,
        };

        const result = await issueService.createIssueByTypeName(issueData);
        printSuccess(`Issue created: ${result.key}`);

        const format: OutputFormat = options.json ? 'json' : 'table';
        printIssue(result, format);
      } catch (error) {
        if (error instanceof Error) {
          printError('Failed to create issue', error);
        }
        process.exit(1);
      }
    });

  // Create bug (convenience)
  issue
    .command('create-bug <projectKey> <summary>')
    .description('Create a bug (convenience method)')
    .option('-d, --description <description>', 'Bug description')
    .option('-a, --assignee <email>', 'Assignee email address')
    .option('-j, --json', 'Output in JSON format')
    .action(async (projectKey: string, summary: string, options) => {
      try {
        const result = await issueService.createBug(
          projectKey,
          summary,
          options.description,
          options.assignee
        );
        printSuccess(`Bug created: ${result.key}`);

        const format: OutputFormat = options.json ? 'json' : 'table';
        printIssue(result, format);
      } catch (error) {
        if (error instanceof Error) {
          printError('Failed to create bug', error);
        }
        process.exit(1);
      }
    });

  // Update issue
  issue
    .command('update <key>')
    .description('Update issue fields')
    .option('-s, --summary <summary>', 'New summary')
    .option('-d, --description <description>', 'New description')
    .action(async (key: string, options) => {
      try {
        if (options.summary) {
          await issueService.updateIssueSummary(key, options.summary);
          printSuccess(`Updated summary for ${key}`);
        }
        if (options.description) {
          await issueService.updateIssueDescription(key, options.description);
          printSuccess(`Updated description for ${key}`);
        }
        if (!options.summary && !options.description) {
          printInfo('No updates specified. Use --summary or --description');
        }
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to update issue ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Assign issue
  issue
    .command('assign <key> <email>')
    .description('Assign issue to user')
    .action(async (key: string, email: string) => {
      try {
        await issueService.assignIssueByEmail(key, email);
        printSuccess(`Assigned ${key} to ${email}`);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to assign issue ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Unassign issue
  issue
    .command('unassign <key>')
    .description('Unassign issue')
    .action(async (key: string) => {
      try {
        await issueService.unassignIssue(key);
        printSuccess(`Unassigned ${key}`);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to unassign issue ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Add labels
  issue
    .command('add-labels <key> <labels...>')
    .description('Add labels to issue')
    .action(async (key: string, labels: string[]) => {
      try {
        await issueService.addLabelsToIssue(key, labels);
        printSuccess(`Added labels to ${key}: ${labels.join(', ')}`);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to add labels to ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Remove labels
  issue
    .command('remove-labels <key> <labels...>')
    .description('Remove labels from issue')
    .action(async (key: string, labels: string[]) => {
      try {
        await issueService.removeLabelsFromIssue(key, labels);
        printSuccess(`Removed labels from ${key}: ${labels.join(', ')}`);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to remove labels from ${key}`, error);
        }
        process.exit(1);
      }
    });

  // Transition issue
  issue
    .command('transition <key> <transitionName>')
    .description('Transition issue to new status')
    .option('-c, --comment <comment>', 'Add transition comment')
    .action(async (key: string, transitionName: string, options) => {
      try {
        await issueService.transitionIssueByName(key, transitionName, options.comment);
        printSuccess(`Transitioned ${key} to ${transitionName}`);
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to transition issue ${key}`, error);
        }
        process.exit(1);
      }
    });

  // List transitions
  issue
    .command('transitions <key>')
    .description('List available transitions for issue')
    .option('-j, --json', 'Output in JSON format')
    .action(async (key: string, options) => {
      try {
        const transitions = await issueService.getAvailableTransitions(key);

        if (options.json) {
          console.log(JSON.stringify(transitions, null, 2));
        } else {
          console.log(`\nAvailable transitions for ${key}:\n`);
          transitions.forEach((t) => {
            console.log(`  • ${t.name} (ID: ${t.id})`);
            if (t.to?.description) {
              console.log(`    ${t.to.description}`);
            }
          });
          console.log('');
        }
      } catch (error) {
        if (error instanceof Error) {
          printError(`Failed to get transitions for ${key}`, error);
        }
        process.exit(1);
      }
    });

  return issue;
}
