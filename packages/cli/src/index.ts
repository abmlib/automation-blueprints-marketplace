#!/usr/bin/env node

import { Command } from "commander";
import { registerLogin } from "./commands/login";
import { registerValidate } from "./commands/validate";
import { registerPublish } from "./commands/publish";

const program = new Command();

program
  .name("abmlib")
  .description("CLI tool for validating and publishing automation blueprints to ABMLib")
  .version("0.2.0");

registerLogin(program);
registerValidate(program);
registerPublish(program);

program.parse();
