#!/usr/bin/env bun

import { $ } from "bun";
import { program } from "commander";

async function buildAndForceRun() {
  await $`bun run build`;
  let result = (await $`lsof -i:3001`.text()).split("\n");
  if (result.length > 1) {
    let secondRow = result[1].split(/\s+/);
    await $`kill ${secondRow[1]}`;
  }
  await $`bash -c "nohup bun run start --port 3001 > bun.log 2>&1 &"`;
}

let devCommand = program.command('dev');
devCommand
  .command('build-and-force-run')
  .action(async () => {
    await buildAndForceRun();
  });

program.parse(Bun.argv);