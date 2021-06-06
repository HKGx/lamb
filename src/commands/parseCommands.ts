// Courtesy of https://github.com/sigma-engineering/blog-combinators

type Parser<T> = (pctx: PContext) => Result<T>;

type PContext = Readonly<{
  text: string;
  pos: number;
}>;

type Result<T> = Success<T> | Failure;

type Success<T> = Readonly<{
  success: true;
  value: T;
  pctx: PContext;
}>;

type Failure = Readonly<{
  success: false;
  expected: string;
  found?: string;
  pctx: PContext;
}>;

function success<T>(pctx: PContext, value: T): Success<T> {
  return { success: true, value, pctx };
}

function failure(pctx: PContext, expected: string, found?: string): Failure {
  return { success: false, expected, pctx, found };
}

function str<S extends string>(match: S): Parser<S> {
  return (pctx) => {
    const end = pctx.pos + match.length;
    if (pctx.text.substring(pctx.pos, end) === match) {
      return success(
        {
          ...pctx,
          pos: end,
        },
        match
      );
    }
    return failure(pctx, match);
  };
}

function regex(re: RegExp, expected?: string): Parser<string> {
  const expects: string = expected || re.source;
  if (!re.global) {
    throw new Error(
      `Provided regex: ${re} which expects ${expects} must be global.`
    );
  }
  return (pctx) => {
    re.lastIndex = pctx.pos;
    const res = re.exec(pctx.text);
    if (res && res.index === pctx.pos) {
      return success({ ...pctx, pos: pctx.pos + res[0].length }, res[0]);
    } else {
      const wordLength = Math.min(
        Math.max(pctx.text.indexOf(" ", pctx.pos) - pctx.pos, 32),
        12
      );
      const found = pctx.text.substr(pctx.pos, wordLength);
      return failure(pctx, expects, found);
    }
  };
}

const none: Parser<undefined> = (ctx: PContext) => success(ctx, undefined);

function seq<A>(...parsers: Parser<A>[]): Parser<A[]> {
  return (pctx) => {
    const values: A[] = [];
    let nextCtx = pctx;
    for (const parser of parsers) {
      const res = parser(nextCtx);
      if (!res.success) return res;
      values.push(res.value);
      nextCtx = res.pctx;
    }
    return success(nextCtx, values);
  };
}

function anyFirst<A>(...parsers: Parser<A>[]): Parser<A> {
  return (pctx) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let furthestRes: Result<A> = undefined!;
    for (const parser of parsers) {
      const res = parser(pctx);
      if (res.success) {
        return res;
      }
      if (!furthestRes || furthestRes.pctx.pos < res.pctx.pos) {
        furthestRes = res;
      }
    }
    return furthestRes;
  };
}

function any<A>(...parsers: Parser<A>[]): Parser<A> {
  return (pctx) => {
    const results = parsers.map((p) => p(pctx));
    const result = results.reduce((prev, curr) => {
      return (prev.success == curr.success && prev.pctx.pos < curr.pctx.pos) ||
        (!prev.success && curr.success)
        ? curr
        : prev;
    });

    return result;
  };
}

function optional<A>(parser: Parser<A>): Parser<A | undefined> {
  return (pctx) => {
    const result = parser(pctx);
    if (result.success) {
      return result;
    } else {
      return none(pctx);
    }
  };
}

function many<A>(parser: Parser<A>): Parser<A[]> {
  return (pctx) => {
    const values: A[] = [];
    let nextCtx = pctx;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = parser(nextCtx);
      if (!res.success) break;
      values.push(res.value);
      nextCtx = res.pctx;
    }
    return success(nextCtx, values);
  };
}

function many1<A>(parser: Parser<A>): Parser<A[]> {
  return (pctx) => {
    const first = parser(pctx);
    if (!first.success) {
      return first;
    }
    const rest = many(parser)(first.pctx) as Success<A[]>;
    return success(rest.pctx, [first.value, ...rest.value]);
  };
}

function map<A, B>(parser: Parser<A>, fn: (val: A) => B): Parser<B> {
  return (pctx) => {
    const res = parser(pctx);
    return res.success ? success(res.pctx, fn(res.value)) : res;
  };
}

function mapExpected<T>(
  parser: Parser<T>,
  fn: ((expected: string) => string) | string
): Parser<T> {
  return (pctx) => {
    const res = parser(pctx);
    return res.success
      ? res
      : failure(
          res.pctx,
          typeof fn === "string" ? fn : fn(res.expected),
          res.found
        );
  };
}

function expectEOF<T>(parser: Parser<T>): Parser<T> {
  return (pctx) => {
    const res = parser(pctx);
    if (!res.success) {
      return res;
    }
    if (res.pctx.pos !== res.pctx.text.length) {
      return failure(res.pctx, `Expected EOF at position ${res.pctx.pos}`);
    }
    return res;
  };
}

// imagine parser matching any letter
// then separator would match space
// so parsing a string like "a b d q j k i"
// would return ["a", "b", "d", "q", "j", "k", "i"]
function sepBy<A, B>(parser: Parser<A>, separator: Parser<B>): Parser<A[]> {
  return (pctx) => {
    const values: A[] = [];
    let nextCtx = pctx;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const value = parser(nextCtx);

      if (!value.success) {
        break;
      }
      values.push(value.value);
      const sep = separator(value.pctx);
      nextCtx = sep.pctx;
      if (!sep.success) {
        break;
      }
    }
    return success(nextCtx, values);
  };
}

const wrap = <A, B>(parser: Parser<A>, wrapper: Parser<B>) =>
  mid(wrapper, parser, wrapper);

const between = <A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>) => {
  mid(a, b, c);
};

function or<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B> {
  return (ctx) => {
    const left = a(ctx);
    if (left.success) {
      return left;
    }
    const right = b(ctx);
    if (right.success) {
      return right;
    }
    return failure(ctx, [right.expected, left.expected].join(" | "));
  };
}

function left<A, B>(a: Parser<A>, b: Parser<B>): Parser<A> {
  return (ctx) => {
    const l = a(ctx);
    if (!l.success) {
      return l;
    }
    const r = b(l.pctx);
    if (!r.success) {
      return r;
    }
    return success(r.pctx, l.value);
  };
}

function right<A, B>(a: Parser<A>, b: Parser<B>): Parser<B> {
  return (ctx) => {
    const l = a(ctx);
    if (!l.success) {
      return l;
    }
    const r = b(l.pctx);
    if (!r.success) {
      return r;
    }
    return success(r.pctx, r.value);
  };
}

const mid = <A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>) =>
  right(a, left(b, c));

const opWs = regex(/ */g, "optional whitespace");
const ws = regex(/ +/g, "mandatory whitespace");

function parse<T>(text: string, parser: Parser<T>) {
  return parser({ text: text, pos: 0 });
}

export {
  PContext,
  Failure,
  Success,
  Parser,
  Result,
  any,
  anyFirst,
  expectEOF,
  many,
  many1,
  failure,
  success,
  left,
  map,
  mapExpected,
  mid,
  none,
  opWs,
  optional,
  or,
  regex,
  right,
  sepBy,
  seq,
  str,
  wrap,
  between,
  ws,
  parse,
};
