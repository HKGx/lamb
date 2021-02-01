import { Message, TextChannel } from "discord.js";

import { expectEOF, or } from "./parseCommands";

import { any, Bot, left, map, opWs, Parser, seq, str, wrap, ws } from ".";

class Argument<T> {
  name: string;
  parser: Parser<T>;
  constructor(name: string, parser: Parser<T>) {
    this.name = name;
    this.parser = parser;
  }
}

const argument = <T>(name: string, parser: Parser<T>) =>
  new Argument(name, parser);

class Context {
  readonly client: Bot;
  readonly message: Message;
  readonly send: TextChannel["send"];
  readonly reply: Message["reply"];
  readonly invokedByMention: boolean;
  constructor(client: Bot, message: Message) {
    this.client = client;
    this.message = message;
    this.send = this.message.channel.send.bind(this.message.channel);
    this.reply = this.message.reply.bind(this.message);
    this.invokedByMention = this.message.content.startsWith("<@");
  }
}

abstract class Command {
  $resolve?: Parser<string>;
  abstract readonly name: string;
  readonly aliases: (string | Parser<string>)[] = [];
  readonly arguments: readonly Argument<unknown>[] = [];
  readonly checks: readonly ((ctx: Context) => Promise<boolean>)[] = [];
  $base?: Command;

  public async isExecutionValid(ctx: Context) {
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

  get parseArguments() {
    return seq(...this.arguments.map((a) => wrap(a.parser, opWs)));
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

// TODO: implement a more dynamic way to create commands
// TODO: using decorators
// function command<T extends Command>(
//   target: T,
//   propertyKey: string,
//   descriptor: TypedPropertyDescriptor<Command["invoke"]>
// ) {
//   console.log("-- target --");
//   console.log(target);
//   console.log("-- proertyKey --");
//   console.log(propertyKey);
//   console.log("-- descriptor --");
//   console.log(descriptor);
//   console.log(descriptor.value?.name);
// }

export { Command, Context, Argument, argument };
