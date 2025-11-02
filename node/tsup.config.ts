import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    target: 'node18',
    outDir: 'dist',
  },
  // CLI build with shebang
  {
    entry: {
      cli: 'src/cli/index.ts',
    },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    shims: true,
    target: 'node18',
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Server build
  {
    entry: {
      server: 'src/server/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    shims: true,
    target: 'node18',
    outDir: 'dist',
  },
  // SDK build
  {
    entry: {
      sdk: 'src/sdk/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    shims: true,
    target: 'node18',
    outDir: 'dist',
  },
]);
