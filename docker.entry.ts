#!/usr/bin/env bun

import { $ } from 'bun';

let runBackend = $`cd backend && bun run serve`;
let runFrontend = $`cd frontend && bun run start --port 8004`;

Promise.all([
  runBackend,
  runFrontend,
]);