#!/usr/bin/env node
import { main } from '../lib/cli.mjs';
try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`Orbit Handoff: ${error.message}`);
  process.exitCode = 1;
}
