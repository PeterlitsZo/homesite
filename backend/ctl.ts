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
      -e POSTGRES_PASSWORD=${Bun.env.DATABASE_PASSWORD} \
      -v ${Bun.env.DATABASE_VOLUME}:/var/lib/postgresql/data \
      -p ${Bun.env.DATABASE_PORT}:5432 \
      -d \
      postgres
  `
}

async function addDbMigrate(name: string) {
  await $`bun x prisma migrate dev --name ${name}`
}

async function deployDbMigrate() {
  await $`bun x prisma migrate deploy`
}

let devCommand = program.command('dev');
devCommand
  .command('run-postgres-in-docker')
  .action(async () => {
    await runPostgresInDocker();
  });
devCommand
  .command('add-db-migrate <name>')
  .action(async (name) => {
    await addDbMigrate(name);
  })
devCommand
  .command('deploy-db-migrate')
  .action(async () => {
    await deployDbMigrate();
  })

program.parse(Bun.argv);