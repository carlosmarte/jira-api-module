#!/usr/bin/env ts-node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types for OpenAPI structure
interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  schema?: {
    type?: string;
    format?: string;
    $ref?: string;
  };
}

interface RequestBody {
  description?: string;
  required?: boolean;
  content?: {
    [mediaType: string]: {
      schema?: {
        type?: string;
        $ref?: string;
      };
    };
  };
}

interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  options?: Operation;
  head?: Operation;
}

interface OpenAPISpec {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: PathItem;
  };
}

interface EndpointInfo {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters: Array<{
    name: string;
    location: string;
    type: string;
    required: boolean;
  }>;
  requestBody?: {
    type: string;
    required: boolean;
  };
}

interface GroupedEndpoints {
  [tag: string]: EndpointInfo[];
}

// Helper function to extract type from schema reference or type
function getType(schema?: { type?: string; format?: string; $ref?: string }): string {
  if (!schema) return 'unknown';

  if (schema.$ref) {
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1];
  }

  if (schema.type) {
    return schema.format ? `${schema.type} (${schema.format})` : schema.type;
  }

  return 'unknown';
}

// Parse OpenAPI spec and group endpoints by tags
function parseOpenAPI(spec: OpenAPISpec): GroupedEndpoints {
  const grouped: GroupedEndpoints = {};

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const tags = operation.tags || ['untagged'];
      const summary = operation.summary || 'No summary';
      const description = operation.description;

      // Parse parameters
      const parameters = (operation.parameters || []).map((param) => ({
        name: param.name,
        location: param.in,
        type: getType(param.schema),
        required: param.required || false,
      }));

      // Parse request body if present
      let requestBody: EndpointInfo['requestBody'];
      if (operation.requestBody) {
        const content = operation.requestBody.content;
        let bodyType = 'object';

        if (content) {
          const jsonContent = content['application/json'];
          if (jsonContent?.schema) {
            bodyType = getType(jsonContent.schema);
          }
        }

        requestBody = {
          type: bodyType,
          required: operation.requestBody.required || false,
        };
      }

      const endpoint: EndpointInfo = {
        method: method.toUpperCase(),
        path,
        summary,
        description,
        parameters,
        requestBody,
      };

      // Add endpoint to each of its tags
      for (const tag of tags) {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(endpoint);
      }
    }
  }

  return grouped;
}

// Generate markdown documentation
function generateMarkdown(spec: OpenAPISpec, grouped: GroupedEndpoints): string {
  let markdown = `# ${spec.info.title}\n\n`;
  markdown += `**Version:** ${spec.info.version}\n\n`;

  if (spec.info.description) {
    markdown += `${spec.info.description}\n\n`;
  }

  // Table of contents
  markdown += `## Table of Contents\n\n`;
  const sortedTags = Object.keys(grouped).sort();
  for (const tag of sortedTags) {
    const tagLink = tag.toLowerCase().replace(/\s+/g, '-');
    markdown += `- [${tag}](#${tagLink}) (${grouped[tag].length} endpoints)\n`;
  }
  markdown += `\n---\n\n`;

  // Generate sections for each tag
  for (const tag of sortedTags) {
    markdown += `## ${tag}\n\n`;

    const endpoints = grouped[tag];
    for (const endpoint of endpoints) {
      // Endpoint header
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;

      // Summary
      markdown += `**${endpoint.summary}**\n\n`;

      // Description if available
      if (endpoint.description && endpoint.description !== endpoint.summary) {
        markdown += `${endpoint.description}\n\n`;
      }

      // Parameters
      if (endpoint.parameters.length > 0 || endpoint.requestBody) {
        markdown += `**Parameters:**\n\n`;

        // Path parameters
        const pathParams = endpoint.parameters.filter(p => p.location === 'path');
        if (pathParams.length > 0) {
          for (const param of pathParams) {
            const required = param.required ? '**required**' : 'optional';
            markdown += `- **Path:** \`${param.name}\` (${param.type}) - ${required}\n`;
          }
        }

        // Query parameters
        const queryParams = endpoint.parameters.filter(p => p.location === 'query');
        if (queryParams.length > 0) {
          for (const param of queryParams) {
            const required = param.required ? '**required**' : 'optional';
            markdown += `- **Query:** \`${param.name}\` (${param.type}) - ${required}\n`;
          }
        }

        // Header parameters
        const headerParams = endpoint.parameters.filter(p => p.location === 'header');
        if (headerParams.length > 0) {
          for (const param of headerParams) {
            const required = param.required ? '**required**' : 'optional';
            markdown += `- **Header:** \`${param.name}\` (${param.type}) - ${required}\n`;
          }
        }

        // Request body
        if (endpoint.requestBody) {
          const required = endpoint.requestBody.required ? '**required**' : 'optional';
          markdown += `- **Body:** \`${endpoint.requestBody.type}\` - ${required}\n`;
        }

        markdown += `\n`;
      } else {
        markdown += `*No parameters*\n\n`;
      }

      markdown += `---\n\n`;
    }
  }

  return markdown;
}

// Main execution
function main() {
  try {
    console.log('🚀 Generating API documentation from OpenAPI spec...\n');

    // Read OpenAPI spec
    const specPath = join(process.cwd(), 'SPEC', 'JIRA-v10.x-openapi.json');
    console.log(`📖 Reading OpenAPI spec from: ${specPath}`);
    const specContent = readFileSync(specPath, 'utf-8');
    const spec: OpenAPISpec = JSON.parse(specContent);

    console.log(`✅ Loaded ${spec.info.title} v${spec.info.version}`);
    console.log(`📊 Found ${Object.keys(spec.paths).length} paths\n`);

    // Parse and group endpoints
    console.log('🔍 Parsing endpoints...');
    const grouped = parseOpenAPI(spec);

    const totalEndpoints = Object.values(grouped).reduce((sum, endpoints) => sum + endpoints.length, 0);
    console.log(`✅ Parsed ${totalEndpoints} endpoints across ${Object.keys(grouped).length} tags\n`);

    // Generate markdown
    console.log('📝 Generating markdown documentation...');
    const markdown = generateMarkdown(spec, grouped);

    // Write to file
    const outputPath = join(process.cwd(), 'SPEC', 'API.md');
    writeFileSync(outputPath, markdown, 'utf-8');

    console.log(`✅ API documentation generated successfully!`);
    console.log(`📄 Output: ${outputPath}\n`);

    // Summary statistics
    console.log('📊 Summary:');
    const sortedTags = Object.keys(grouped).sort();
    for (const tag of sortedTags) {
      console.log(`   - ${tag}: ${grouped[tag].length} endpoints`);
    }
  } catch (error) {
    console.error('❌ Error generating API documentation:', error);
    process.exit(1);
  }
}

main();
