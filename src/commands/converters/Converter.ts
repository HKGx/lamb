import { Context, Parser, regex } from "..";
import { Bot } from "../../bot";

export type ConverterResult<T> = Promise<T | ConverterError>;

export abstract class Converter<T> {
  private readonly $bot: Bot;

  public get bot(): Bot {
    return this.$bot;
  }
  constructor(bot: Bot) {
    this.$bot = bot;
  }
  abstract convert(ctx: Context): Parser<ConverterResult<T>>;
}
export const idParser = regex(/\d{15,22}/g, "id") as Parser<`${bigint}`>;
export class ConverterError extends Error {}
