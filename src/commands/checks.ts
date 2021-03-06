import { Context } from ".";

function isOwner(ctx: Context) {
  return Promise.resolve(ctx.bot.ownerId === ctx.message.author.id);
}

function invokedByMention(ctx: Context) {
  return Promise.resolve(ctx.invokedByMention);
}

export { isOwner, invokedByMention };
