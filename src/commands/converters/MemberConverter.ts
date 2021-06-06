import {
  Collection,
  Constants,
  DiscordAPIError,
  FetchMembersOptions,
  GuildMember,
} from "discord.js";

import { any, Context, map, mapExpected, mid, regex, str } from "..";

import { idParser } from "./Converter";
import { stringParser } from "./StringConverter";

import { Converter, ConverterError } from ".";

const mentionStart = regex(/<@!?/g);
const mentionEnd = str(">");

const parseMention = mid(mentionStart, idParser, mentionEnd);

function getMember(ctx: Context) {
  return async (options: FetchMembersOptions) => {
    try {
      const member = (await ctx.message.guild?.members.fetch(options)) as
        | GuildMember
        | Collection<string, GuildMember>;
      if (member instanceof GuildMember) {
        return member;
      } else if (member instanceof Collection) {
        const first = member.first();
        if (first) {
          return first;
        }
      }
      return new ConverterError("Unknown member");
    } catch (exception) {
      const { UNKNOWN_MEMBER, UNKNOWN_USER } = Constants.APIErrors;
      if (
        exception instanceof DiscordAPIError &&
        ([UNKNOWN_MEMBER, UNKNOWN_USER] as number[]).includes(exception.code)
      ) {
        return new ConverterError("Unknown member");
      }
      throw exception;
    }
  };
}

export class MemberConveter extends Converter<GuildMember> {
  convert(ctx: Context) {
    const getter = getMember(ctx);
    const parseId = map(idParser, (id) => getter({ user: id }));
    const mention = map(parseMention, (id) => getter({ user: id }));
    const username = map(stringParser, (username) =>
      getter({ query: username, limit: 1 })
    );
    return mapExpected(
      any(parseId, mention, username),
      "Expected a mention or an username"
    );
  }
}
