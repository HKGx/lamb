import { config } from "dotenv";

config();

interface _Env {
  LAMB_MONGO_URL?: string;
  LAMB_BOT_TOKEN?: string;
  LAMB_OWNER_ID?: string;
  LAMB_PREFIX?: string;
}

export type Env = Readonly<Required<_Env>>;

export function validatedEnv() {
  const obj: _Env = {};
  const props: Array<keyof _Env> = [
    "LAMB_MONGO_URL",
    "LAMB_BOT_TOKEN",
    "LAMB_OWNER_ID",
    "LAMB_PREFIX",
  ];
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
