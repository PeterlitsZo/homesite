#!/usr/bin/env bun

import { $ } from 'bun';
import fs from 'fs';

if (!fs.existsSync('./frontend')) {
  await $`cp -r ../frontend ./frontend`
}
if (!fs.existsSync('backend')) {
  await $`cp -r ../backend ./backend`
}
await $`docker build --no-cache --build-arg HTTP_PROXY="http://192.168.124.1:7890" -t homesite .`