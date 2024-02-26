#!/usr/bin/env bun

import { $ } from 'bun';
import fs from 'fs';

async function build() {
  await $`bash -c "rm -rf ./frontend"`
  await $`bash -c "rm -rf ./backend"`

  if (!fs.existsSync('frontend')) {
    await $`cp -r ../frontend ./frontend`
  }
  if (!fs.existsSync('backend')) {
    await $`cp -r ../backend ./backend`
  }
  await $`docker build -t homesite .`
}

async function run() {
  await $`bash -c "rm -rf configs"`;

  if (!fs.existsSync('configs')) {
    if (!fs.existsSync('../frontend/.env.production')) {
      throw new Error('Cannot find ../frontend/.env.production')
    }
    if (!fs.existsSync('../backend/.env.production')) {
      throw new Error('Cannot find ../backend/.env.production')
    }
  
    await $`mkdir -p ./configs/frontend && mkdir -p ./configs/backend`
    await $`cp ../frontend/.env.production ./configs/frontend/`
    await $`cp ../backend/.env.production ./configs/backend/`
  }

  await $`
    docker run -v ./configs:/homesite/configs -v ./homesite.db:/homesite/homesite.db -p 8002:8999 -it homesite
  `;
}

if (Bun.argv[2] === "build") {
  await build();
} else if (Bun.argv[2] === "run") {
  await run();
} else {
  throw new Error("Unexpected command");
}
