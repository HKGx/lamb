import { Message } from "discord.js";

import { Context } from "../command";
import { left, map, seq, str } from "../parseCommands";

import { ConverterError, idParser } from "./Converter";

import { Converter } from ".";

const hyphen = str("-");
const channelIdParser = left(idParser, hyphen);
const messageIdParser = idParser;
const channelMessageParser = (ctx: Context) =>
  map(seq(channelIdParser, messageIdParser), async ([channelId, messageId]) => {
    const channel = await ctx.bot.channels.fetch(channelId);
    if (!channel) {
      return new ConverterError(`Channel '${channelId}' doesn't exist!`);
    }
    if (!channel.isText()) {
      return new ConverterError(
        `Channel '${channelId}' is not a text channel!`
      );
    }

    const message = await channel.messages.fetch(messageId);
    return message;
  });

export class MessageConverter extends Converter<Message> {
  convert(ctx: Context) {
    return channelMessageParser(ctx);
  }
}
