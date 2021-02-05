import discord, { Message } from "discord.js";

import {
  any,
  Command,
  Context,
  left,
  opWs,
  or,
  parse,
  Parser,
  regex,
  str,
} from "./commands";
import { Env } from "./env";
import { endsWith, getFiles } from "./util";

export class Bot extends discord.Client {
  private $env: Env;
  private readonly $parsePrefix;
  private $parseCommand!: Parser<Command>;
  private $parseMention!: Parser<string>;
  commands: Command[] = [];
  constructor(env: Env) {
    super({
      allowedMentions: { repliedUser: true },
      presence: {
        activity: { type: "WATCHING", name: "Netflix" },
      },
    });
    this.$env = env;
    this.$parsePrefix = str(env.LAMB_PREFIX);
    this.loadCommands();

    super.on("message", this.handleMessage);
    super.on("ready", this.onReady);
  }

  async loadCommands() {
    const files = await getFiles(`${__dirname}/customCommands/`);
    const filtered = files
      .map((f) => f.path)
      .filter((f) => endsWith(f, ".cmd.ts"));

    const modules = await Promise.all(filtered.map((x) => import(x)));
    const commands = modules
      .filter(
        (module): module is { default: Command } =>
          "default" in module && module.default instanceof Command
      )
      .map((m) => m.default);
    commands.forEach((cmd) => {
      if (cmd.onMessage) {
        this.on("message", cmd.onMessage);
      }
    });
    console.log(`Loaded ${commands.length} commands!`);
    this.commands.push(...commands);
  }

  get parseCommand() {
    if (!this.$parseCommand) {
      const commandNameParsers = this.commands.map((c) => c.resolveCommand);
      this.$parseCommand = any(...commandNameParsers);
    }
    return this.$parseCommand;
  }

  onReady() {
    const fullname = `${this.user?.username}#${this.user?.discriminator}`;
    console.log(`LOGGED IN AS: ${fullname}`);
  }

  public get parseMention(): Parser<string> {
    if (!this.user?.id) {
      throw new Error("Bad access!");
    }
    if (!this.$parseMention) {
      this.$parseMention = left(
        regex(new RegExp(`<@!?${this.user.id}>`, "g"), "mention"),
        opWs
      );
    }
    return this.$parseMention;
  }

  async handleMessage(message: Message) {
    if (message.author.bot) {
      return;
    }
    if (
      [`<@${this.user?.id}>`, `<@!${this.user?.id}>`].includes(message.content)
    ) {
      await message.reply("W ścianę.");
      return;
    }
    const prefix = parse(
      message.content,
      or(this.parseMention, this.$parsePrefix)
    );
    if (!prefix.success) {
      return;
    }
    const command = this.parseCommand(prefix.ctx);
    if (!command.success) {
      await message.reply("Unknown command!");
      return;
    }
    const ctx = new Context(this, message);
    const validToExecute = await command.value.isExecutionValid(ctx);
    if (!validToExecute) {
      return;
    }
    const args = command.value.parseArguments(command.ctx);
    if (!args.success) {
      await message.channel.send("Invalid argument");
      return;
    }
    await command.value.invoke(ctx, ...args.value);
  }

  login(): Promise<string> {
    return super.login(this.$env.LAMB_BOT_TOKEN);
  }

  public get ownerId(): string {
    return this.$env.LAMB_OWNER_ID;
  }
}
