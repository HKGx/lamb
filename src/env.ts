import { config } from "dotenv";

config();

interface _Env {
  LAMB_MONGO_URL: string;
  LAMB_BOT_TOKEN: string;
  LAMB_OWNER_ID: string;
  LAMB_PREFIX: string;
  LAMB_MONGO_USER: string;
  LAMB_MONGO_PASSWORD: string;
}

export type Env = Readonly<_Env>;

export function validatedEnv() {
  const obj: Record<string, string> = {};
  const props = [
    "LAMB_MONGO_URL",
    "LAMB_BOT_TOKEN",
    "LAMB_OWNER_ID",
    "LAMB_PREFIX",
    "LAMB_MONGO_USER",
    "LAMB_MONGO_PASSWORD",
  ] as const;
  for (const prop of props) {
    const value = process.env[prop];
    if (value) {
      obj[prop] = value;
    } else {
      return new Error(`${prop} enviroment variable wasn't set.`);
    }
  }

  return obj as Env;
}
