import { map, regex } from "..";
import { failure, Parser, PContext, success } from "../parseCommands";

import { Converter } from ".";

const parseSingleWord = regex(/[^\s]+/g, "single word");

const floatParser: Parser<number> = (pctx: PContext) => {
  const word = parseSingleWord(pctx);
  if (!word.success) {
    return word;
  }
  const float = parseFloat(word.value);
  if (isFinite(float)) {
    const pos = pctx.pos + word.value.length;
    return success(
      {
        ...pctx,
        pos,
      },
      float
    );
  }
  return failure(pctx, "float", word.value);
};

const integerParser: Parser<number> = (pctx: PContext) => {
  const word = parseSingleWord(pctx);
  if (!word.success) {
    return word;
  }
  const integer = parseInt(word.value);
  if (isFinite(integer)) {
    const pos = pctx.pos + word.value.length;
    return success(
      {
        ...pctx,
        pos,
      },
      integer
    );
  }
  return failure(pctx, "integer", word.value);
};

export class Integer extends Number {}

export class IntegerConverter extends Converter<number> {
  convert() {
    return map(integerParser, (f) => Promise.resolve(f));
  }
}

export class FloatConverter extends Converter<number> {
  convert() {
    return map(floatParser, (f) => Promise.resolve(f));
  }
}

// const start = regex(/\[\s*/g);
// const sep = regex(/\s*,\s*/g);
// const end = str("]");

// export class StringArrayConverter extends Converter<string[]> {
//   convert() {
//     return map(mid(start, sepBy(parseQuotedString, sep), end), (strs) =>
//       Promise.resolve(strs)
//     );
//   }
// }
