// Courtesy of https://github.com/sigma-engineering/blog-combinators

type Parser<T> = (ctx: PContext) => Result<T>;

type PContext = Readonly<{
  text: string;
  pos: number;
}>;

type Result<T> = Success<T> | Failure;

type Success<T> = Readonly<{
  success: true;
  value: T;
  ctx: PContext;
}>;

type Failure = Readonly<{
  success: false;
  expected: string;
  found?: string;
  ctx: PContext;
}>;

function success<T>(ctx: PContext, value: T): Success<T> {
  return { success: true, value, ctx };
}

function failure(ctx: PContext, expected: string, found?: string): Failure {
  return { success: false, expected, ctx, found };
}

function str(match: string): Parser<string> {
  return (ctx) => {
    const end = ctx.pos + match.length;
    if (ctx.text.substring(ctx.pos, end) === match) {
      return success(
        {
          ...ctx,
          pos: end,
        },
        match
      );
    }
    return failure(ctx, match);
  };
}

function regex(re: RegExp, expected?: string): Parser<string> {
  const expects: string = expected || re.source;
  if (!re.global) {
    throw new Error(
      `Provided regex: ${re} which expects ${expects} must be global.`
    );
  }
  return (ctx) => {
    re.lastIndex = ctx.pos;
    const res = re.exec(ctx.text);
    if (res && res.index === ctx.pos) {
      return success({ ...ctx, pos: ctx.pos + res[0].length }, res[0]);
    } else {
      const wordLength = Math.min(
        Math.max(ctx.text.indexOf(" ", ctx.pos) - ctx.pos, 32),
        12
      );
      const found = ctx.text.substr(ctx.pos, wordLength);
      return failure(ctx, expects, found);
    }
  };
}

const none: Parser<null> = (ctx: PContext) => success(ctx, null);

function seq<A>(...parsers: Parser<A>[]): Parser<A[]> {
  return (ctx) => {
    const values: A[] = [];
    let nextCtx = ctx;
    for (const parser of parsers) {
      const res = parser(nextCtx);
      if (!res.success) return res;
      values.push(res.value);
      nextCtx = res.ctx;
    }
    return success(nextCtx, values);
  };
}

function anyFirst<A>(...parsers: Parser<A>[]): Parser<A> {
  return (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let furthestRes: Result<A> = undefined!;
    for (const parser of parsers) {
      const res = parser(ctx);
      if (res.success) {
        return res;
      }
      if (!furthestRes || furthestRes.ctx.pos < res.ctx.pos) {
        furthestRes = res;
      }
    }
    return furthestRes;
  };
}

function any<A>(...parsers: Parser<A>[]): Parser<A> {
  return (ctx) => {
    const results = parsers.map((p) => p(ctx));
    const result = results.reduce((prev, curr) => {
      return (prev.success == curr.success && prev.ctx.pos < curr.ctx.pos) ||
        (!prev.success && curr.success)
        ? curr
        : prev;
    });

    return result;
  };
}

function optional<A>(parser: Parser<A>): Parser<A | null> {
  return any(parser);
}

function many<A>(parser: Parser<A>): Parser<A[]> {
  return (ctx) => {
    const values: A[] = [];
    let nextCtx = ctx;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = parser(nextCtx);
      if (!res.success) break;
      values.push(res.value);
      nextCtx = res.ctx;
    }
    return success(nextCtx, values);
  };
}

function many1<A>(parser: Parser<A>): Parser<A[]> {
  return (ctx) => {
    const first = parser(ctx);
    if (!first.success) {
      return first;
    }
    const rest = many(parser)(first.ctx) as Success<A[]>;
    return success(rest.ctx, [first.value, ...rest.value]);
  };
}

function map<A, B>(parser: Parser<A>, fn: (val: A) => B): Parser<B> {
  return (ctx) => {
    const res = parser(ctx);
    return res.success ? success(res.ctx, fn(res.value)) : res;
  };
}

function mapExpected<T>(
  parser: Parser<T>,
  fn: (expected: string) => string
): Parser<T> {
  return (ctx) => {
    const res = parser(ctx);
    return res.success ? res : failure(res.ctx, fn(res.expected), res.found);
  };
}

function expectEOF<T>(parser: Parser<T>): Parser<T> {
  return (ctx) => {
    const res = parser(ctx);
    if (!res.success) {
      return res;
    }
    if (res.ctx.pos !== res.ctx.text.length) {
      return failure(res.ctx, `Expected EOF at position ${res.ctx.pos}`);
    }
    return res;
  };
}

// imagine parser matching any letter
// then separator would match space
// so parsing a string like "a b d q j k i"
// would return ["a", "b", "d", "q", "j", "k", "i"]
function sepBy<A, B>(parser: Parser<A>, separator: Parser<B>): Parser<A[]> {
  return (ctx) => {
    const values: A[] = [];
    let nextCtx = ctx;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const value = parser(nextCtx);

      if (!value.success) {
        break;
      }
      values.push(value.value);
      const sep = separator(value.ctx);
      nextCtx = sep.ctx;
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
    const r = b(l.ctx);
    if (!r.success) {
      return r;
    }
    return success(r.ctx, l.value);
  };
}

function right<A, B>(a: Parser<A>, b: Parser<B>): Parser<B> {
  return (ctx) => {
    const l = a(ctx);
    if (!l.success) {
      return l;
    }
    const r = b(l.ctx);
    if (!r.success) {
      return r;
    }
    return success(r.ctx, r.value);
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
