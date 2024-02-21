#!/usr/bin/env bun

import { $ } from "bun";
import { program } from "commander";

async function runPostgresInDocker() {
  const containerName = 'homesite_postgres';

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
      -e POSTGRES_PASSWORD=dev_password \
      -v ./.dev_tmp/postgres_data:/var/lib/postgresql/data \
      -p 5432:5432 \
      -d \
      postgres
  `
}

async function dbMigrate(name: string) {
  await $`bun x prisma migrate dev --name ${name}`
}

let devCommand = program.command('dev');
devCommand
  .command('run-postgres-in-docker')
  .action(async () => {
    await runPostgresInDocker();
  });
devCommand
  .command('db-migrate <name>')
  .action(async (name) => {
    await dbMigrate(name);
  })

program.parse(Bun.argv);