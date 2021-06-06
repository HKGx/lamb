import { map, mid, or, regex, str, wrap } from "..";
import { sepBy } from "../parseCommands";

import { Converter } from ".";

const parseQuotedString = wrap(
  regex(/(?:(?:\\")|[^"])+/g, "characters"),
  str('"')
);
const parseSingleWord = regex(/[^\s]+/g, "single word");

export const stringParser = or(parseQuotedString, parseSingleWord);

export class StringConverter extends Converter<string> {
  convert() {
    return map(stringParser, (str) => Promise.resolve(str));
  }
}

const start = regex(/\[\s*/g);
const sep = regex(/\s*,\s*/g);
const end = str("]");

export class StringArrayConverter extends Converter<string[]> {
  convert() {
    return map(mid(start, sepBy(parseQuotedString, sep), end), (strs) =>
      Promise.resolve(strs)
    );
  }
}
