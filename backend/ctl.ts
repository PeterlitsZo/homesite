#!/usr/bin/env bun

import { $ } from "bun";
import { program } from "commander";

async function runSurrealdbInDocker() {
  const containerName = 'homesite_surreal';

  const names = await $`
    docker ps -f "name=${containerName}" --format '{{.Names}}'
  `.text();
  if (names.trim() === containerName) {
    console.log(`Container ${containerName} already exists, try rm it before rerun.`);
    await $`docker rm -f ${containerName}`;
  }

  await $`
    docker run --rm \
      --name ${containerName} \
      -p 8000:8000 \
      surrealdb/surrealdb:latest start --auth --user ${Bun.env.SURREAL_USERNAME} --pass ${Bun.env.SURREAL_PASSWORD}
  `
}

let devCommand = program.command('dev');
devCommand
  .command('run-surrealdb-in-docker')
  .action(async () => {
    await runSurrealdbInDocker();
  });

program.parse(Bun.argv);