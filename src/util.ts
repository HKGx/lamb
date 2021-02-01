import { readdir } from "fs/promises";

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
