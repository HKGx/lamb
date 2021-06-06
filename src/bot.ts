import discord, { GuildMember, Intents, Message } from "discord.js";

import {
  any,
  ArgumentValue,
  Command,
  Context,
  Converter,
  ConverterError,
  left,
  opWs,
  or,
  parse,
  Parser,
  regex,
  str,
} from "./commands";
import { MemberConveter } from "./commands/converters/MemberConverter";
import { MessageConverter } from "./commands/converters/MessageConverter";
import {
  StringArrayConverter,
  StringConverter,
} from "./commands/converters/StringConverter";
import { Env } from "./env";
import { endsWith, getFiles, startsWith } from "./util";
interface ConverterValue<T> {
  value: Converter<T>;
  array?: Converter<T[]>;
}

function converterNameFor(arg: ArgumentValue) {
  if ("name" in arg) {
    return arg.name;
  }
  if ("name" in arg[0]) {
    return `[${arg[0].name}]`;
  }
  throw new Error("Can't get name from ArgumentValue.");
}

export class Bot extends discord.Client {
  private $env: Env;
  private readonly $parsePrefix: Parser<string>;
  private $parseCommand!: Parser<Command>;
  private $parseMention!: Parser<string>;
  private $converters: Map<ArgumentValue, ConverterValue<unknown>> = new Map();
  commands: Command[] = [];
  constructor(env: Env) {
    super({
      allowedMentions: { repliedUser: true },
      presence: {
        activities: [{ type: "WATCHING", name: "Netflix" }],
      },
      intents: Intents.ALL,
    });
    this.addBasicConverters();
    this.$env = env;
    this.$parsePrefix = str(env.LAMB_PREFIX);
    this.loadCommands();

    super.on("message", this.handleMessage);
    super.once("ready", this.onReady);
  }

  private addBasicConverters() {
    this.addConverter(String, new StringConverter(this));
    this.addArrayConverter(String, new StringArrayConverter(this));
    this.addConverter(GuildMember, new MemberConveter(this));
    this.addConverter(Message, new MessageConverter(this));
  }
  addArrayConverter<T>(arg: ArgumentValue, converter: Converter<T[]>) {
    const value = this.$converters.get(arg);
    if (!value) {
      throw new Error(
        `Can't define array converter for ${converterNameFor(
          arg
        )} if the base type is not defined.`
      );
    }
    if (value.array) {
      throw new Error(
        `Converter for type ${converterNameFor(arg)} is already defined.`
      );
    }
    value.array = converter;
  }
  addConverter<T>(arg: ArgumentValue, converter: Converter<T>) {
    const value = this.$converters.get(arg);
    if (value) {
      throw new Error(
        `Converter for type ${converterNameFor(arg)} is already defined.`
      );
    }
    this.$converters.set(arg, { value: converter });
  }

  getConverter(cls: ArgumentValue): Converter<unknown> {
    const constructor = Array.isArray(cls) ? cls[0] : cls;
    const value = this.$converters.get(constructor);
    if (!value) {
      throw new Error(
        `Converter for ${converterNameFor(cls)} is not defined defined!`
      );
    }
    if (Array.isArray(cls)) {
      if (value.array) {
        return value.array;
      } else {
        throw new Error(
          `Converter for ${converterNameFor(cls)} is not defined defined!`
        );
      }
    } else {
      return value.value;
    }
  }

  async loadCommands() {
    const files = await getFiles(`${__dirname}/customCommands/`);
    const filtered = files
      .map((f) => f.path)
      .filter((f) => endsWith(f, ".cmd.ts") && !startsWith(f, "."));

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
    if (message.author.bot || !message.guild) {
      return;
    }
    if (
      `<@${this.user?.id}>` === message.content ||
      `<@!${this.user?.id}>` === message.content
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
    const command = this.parseCommand(prefix.pctx);
    if (!command.success) {
      await message.reply("Unknown command!");
      return;
    }
    const ctx = new Context(this, message);
    const validToExecute = await command.value.checksValid(ctx);
    if (!validToExecute) {
      return;
    }

    const args = command.value.parseArguments(ctx)(command.pctx);
    if (!args.success) {
      console.log(args);
      await message.channel.send("Invalid argument: " + args.expected);
      return;
    }
    const argsValues = await Promise.all(args.value);
    argsValues.map((value, idx) => {
      const arg = command.value.arguments[idx];
      if (
        value instanceof ConverterError &&
        "optional" in arg &&
        arg.optional
      ) {
        return undefined;
      }
      return value;
    });
    const error = argsValues.find(
      (value): value is ConverterError => value instanceof ConverterError
    );
    if (error) {
      await ctx.reply(error.message);
      return;
    }
    await command.value.invoke(ctx, ...argsValues);
  }

  login(): Promise<string> {
    return super.login(this.$env.LAMB_BOT_TOKEN);
  }

  public get ownerId(): string {
    return this.$env.LAMB_OWNER_ID;
  }
}
