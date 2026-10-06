#!/usr/bin/env node
import { main } from '../lib/cli.mjs';
try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`Orbit Thread: ${error.message}`);
  process.exitCode = 1;
}
