import "reflect-metadata";
import "source-map-support/register";

import mongoose from "mongoose";

import { Bot } from "./bot";
import { Env, validatedEnv } from "./env";

const env = validatedEnv();

if (env instanceof Error) {
  throw env;
}

(async function name(env: Env) {
  await mongoose.connect(env.LAMB_MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    authSource: "lamb",
    dbName: "lamb",
    user: env.LAMB_MONGO_USER,
    pass: env.LAMB_MONGO_PASSWORD,
  });

  const bot = new Bot(env);

  bot.login();
})(env);
