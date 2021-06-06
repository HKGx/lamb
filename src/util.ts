import { readdir } from "fs/promises";

import { Util } from "discord.js";

export async function getFiles(path: string) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = entries
    .filter((file) => !file.isDirectory())
    .map((file) => ({ ...file, path: path + file.name }));
  const folders = entries.filter((folder) => folder.isDirectory());
  for (const folder of folders)
    files.push(...(await getFiles(`${path}${folder.name}/`)));

  return files;
}

export function endsWith<T extends string, U extends string>(
  str: string,
  end: U
): str is `${T}${U}` {
  return str.endsWith(end);
}

export function startsWith<T extends string, U extends string>(
  str: string,
  start: U
): str is `${U}${T}` {
  return str.startsWith(start);
}

export function sanitize(str: string) {
  return Util.escapeMarkdown(Util.removeMentions(str));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...any: any[]) => T;
