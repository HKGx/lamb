import { Context, map, mapExpected, or, regex, str, wrap } from ".";

export const parseSingleWord = regex(/[^\s]+/g, "single word");
export const parseQuotedString = wrap(regex(/[^"]+/g, "characters"), str('"'));

export const stringConverter = mapExpected(
  or(parseQuotedString, parseSingleWord),
  () => "string"
);

//TODO: REWRITE
export const convertMessageLink = map(parseSingleWord, (str) => {
  const linkRegex = /^https?:\/\/(?:(?:ptb|canary|www)\.)?discord(?:app)?\.com\/channels\/(?:[0-9]{15,21}|@me)\/(?<channelId>[0-9]{15,21})\/(?<messageId>[0-9]{15,21})$/i;
  const executedRegex = linkRegex.exec(str);
  if (!executedRegex) {
    return () => Promise.resolve(null);
  }
  const groups = executedRegex.groups;
  if (groups && "channelId" in groups && "messageId" in groups) {
    const { channelId, messageId } = groups;
    return async (ctx: Context) => {
      const channel = await ctx.client.channels.fetch(channelId);
      if (channel.isText()) {
        return channel.messages.fetch(messageId);
      }
      return null;
    };
  }
  return () => Promise.resolve(null);
});
