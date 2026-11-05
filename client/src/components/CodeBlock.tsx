import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
  "switch", "case", "break", "continue", "new", "typeof", "instanceof", "in", "of",
  "void", "await", "async", "yield", "import", "from", "export", "default", "class",
  "extends", "implements", "interface", "type", "enum", "public", "private",
  "protected", "readonly", "abstract", "static", "namespace", "declare", "as",
  "get", "set", "this", "super", "try", "catch", "finally", "throw", "delete",
  "keyof", "infer", "is", "null", "undefined", "true", "false", "number",
  "string", "boolean", "any", "unknown", "never", "object", "symbol", "bigint",
  "void",
]);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Lightweight, allocation-free tokenizer. Operates on already-escaped
 *  output so the result is always safe to inject. */
function highlight(code: string): string {
  let i = 0;
  const n = code.length;
  let out = "";
  while (i < n) {
    const c = code[i];
    // line comment
    if (c === "/" && code[i + 1] === "/") {
      let j = i;
      while (j < n && code[j] !== "\n") j++;
      out += `<span class="tok-cm">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // block comment
    if (c === "/" && code[i + 1] === "*") {
      let j = i + 2;
      while (j < n && !(code[j] === "*" && code[j + 1] === "/")) j++;
      j = Math.min(n, j + 2);
      out += `<span class="tok-cm">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // strings (single / double / template)
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      let j = i + 1;
      while (j < n) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === q) {
          j++;
          break;
        }
        if (q !== "`" && code[j] === "\n") break;
        j++;
      }
      const cls = q === "`" ? "tok-tpl" : "tok-str";
      out += `<span class="${cls}">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // numbers
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(code[i + 1] ?? ""))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxX._eE+-]/.test(code[j])) {
        // stop the sign from gluing on to the next token
        if ((code[j] === "+" || code[j] === "-") && j > i && !/[eE]/.test(code[j - 1])) break;
        j++;
      }
      out += `<span class="tok-num">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // identifiers / keywords
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      out += KEYWORDS.has(word)
        ? `<span class="tok-kw">${esc(word)}</span>`
        : esc(word);
      i = j;
      continue;
    }
    out += esc(c);
    i++;
  }
  return out;
}

export function CodeBlock({ code, fileName }: { code: string; fileName: string }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code), [code]);
  const lineCount = useMemo(() => code.split("\n").length, [code]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__file">{fileName}</span>
        <button
          type="button"
          className="code-block__copy"
          onClick={onCopy}
          aria-label="复制代码"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <div className="code-block__scroll">
        <div className="code-block__gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, idx) => (
            <span key={idx}>{idx + 1}</span>
          ))}
        </div>
        <pre className="code-block__pre">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}
