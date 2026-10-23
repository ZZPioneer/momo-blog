import { readFileSync } from "node:fs";
const s = readFileSync("server/seed.ts", "utf8");

// 按括号深度截取 `key: [ ... ]` 数组的完整文本。
// 兼容空数组 `[]` 与内联的 `ids[0]` / `title: [...][i]` 等，避免非贪婪正则提前在首个 `]` 处收尾。
function matchArray(src, key) {
  const start = src.indexOf(`${key}:`);
  if (start < 0) return null;
  const open = src.indexOf("[", start);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

for (const k of ["projects", "articles", "photos", "collections", "friends", "tracks"]) {
  const body = matchArray(s, k);
  const n = body == null ? "?" : (body.match(/id:/g) || []).length;
  console.log(k, n);
}
const pb = matchArray(s, "photos");
console.log("photo mediaId present:", pb ? /mediaId:\s*"[^"]+"/.test(pb) : false);
