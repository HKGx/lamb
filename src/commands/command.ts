import { Message, TextChannel } from "discord.js";

import { Constructor } from "../util";

import { optional } from "./parseCommands";

import {
  any,
  Bot,
  expectEOF,
  left,
  map,
  opWs,
  or,
  Parser,
  seq,
  str,
  ws,
} from ".";

class Context {
  readonly bot: Bot;
  readonly message: Message;
  readonly send: TextChannel["send"];
  readonly reply: Message["reply"];
  readonly invokedByMention: boolean;
  constructor(bot: Bot, message: Message) {
    this.bot = bot;
    this.message = message;
    this.send = this.message.channel.send.bind(this.message.channel);
    this.reply = this.message.reply.bind(this.message);
    this.invokedByMention = this.message.content.startsWith("<@");
  }
}

export type ArgumentValue =
  | Constructor<unknown>
  | readonly [Constructor<unknown>];

type Argument = { cls: ArgumentValue; optional?: boolean } | ArgumentValue;

const isArgumentWithOptions = (
  arg: Argument
): arg is { cls: ArgumentValue; optional?: boolean } => "cls" in arg;

const argValueToConverter = (ctx: Context, argval: ArgumentValue) => {
  return left(ctx.bot.getConverter(argval).convert(ctx), opWs);
};

type Alias = string | Parser<string>;

abstract class Command {
  $resolve?: Parser<string>;
  abstract readonly name: string;
  readonly aliases: readonly Alias[] = [];
  readonly arguments: readonly Argument[] = [];
  readonly checks: readonly ((ctx: Context) => Promise<boolean>)[] = [];
  $base?: Command;

  public async checksValid(ctx: Context) {
    const checks = await Promise.all(this.checks.map((check) => check(ctx)));
    if (checks.some((check) => !check)) {
      return false;
    }
    return true;
  }

  public abstract invoke(ctx: Context, ...args: unknown[]): Promise<void>;

  get resolve(): Parser<string> {
    if (!this.$resolve) {
      const parseName = str(this.name);
      const parseAliases = this.aliases
        .map((alias) => (typeof alias === "string" ? str(alias) : alias))
        .map((parser) => or(left(parser, ws), expectEOF(parser)));
      this.$resolve = any(
        left(parseName, ws),
        expectEOF(parseName),
        ...parseAliases
      );
    }
    return this.$resolve;
  }

  get resolveCommand(): Parser<Command> {
    return map(this.resolve, () => this);
  }

  parseArguments(ctx: Context) {
    const convertersParsers = this.arguments.map((arg) => {
      if (isArgumentWithOptions(arg)) {
        const converter = argValueToConverter(ctx, arg.cls);
        return arg.optional ? optional(converter) : converter;
      } else {
        return argValueToConverter(ctx, arg);
      }
    });
    return seq(...convertersParsers);
  }

  derive(command: Command) {
    command.$base = this;
    return map(seq(this.resolve, command.resolve), (s) => s.join(""));
  }

  get uniqueName(): string {
    const base = this.$base;
    if (base) {
      return `${base.uniqueName}.${this.name}`;
    }
    return this.name;
  }

  onMessage: ((message: Message) => Promise<void>) | undefined = undefined;
}

export { Command, Context };
