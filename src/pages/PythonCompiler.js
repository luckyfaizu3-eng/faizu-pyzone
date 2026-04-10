/* eslint-disable no-useless-escape, no-eval */
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════════════
   AI
═══════════════════════════════════════════════════ */
const AI_URL = "https://white-limit-e2fe.luckyfaizu3.workers.dev/chat";

async function callAI(messages, onChunk) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 800, temperature: 0.1 }),
  });
  if (!res.ok) throw new Error("AI offline (" + res.status + ")");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let leftover = "", full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = leftover + dec.decode(value, { stream: true });
    const lines = chunk.split("\n");
    leftover = lines.pop() || "";
    for (const l of lines) {
      const t = l.trim();
      if (!t.startsWith("data: ")) continue;
      const d = t.slice(6).trim();
      if (d === "[DONE]" || !d) continue;
      try {
        const p = JSON.parse(d);
        const delta = p.choices?.[0]?.delta?.content;
        if (delta) { full += delta; onChunk?.(full); }
      } catch (_) {}
    }
  }
  return full.trim();
}

/* ═══════════════════════════════════════════════════
   LANGUAGES CONFIG
═══════════════════════════════════════════════════ */
const LANGS = {
  python:     { label: "Python",     ext: "py",   badge: "PY", color: "#3b82f6", runner: "pyodide" },
  javascript: { label: "JavaScript", ext: "js",   badge: "JS", color: "#f59e0b", runner: "eval"   },
  typescript: { label: "TypeScript", ext: "ts",   badge: "TS", color: "#0ea5e9", runner: "ai"     },
  html:       { label: "HTML/CSS",   ext: "html", badge: "HT", color: "#f97316", runner: "html"   },
  cpp:        { label: "C++",        ext: "cpp",  badge: "C+", color: "#8b5cf6", runner: "ai"     },
  csharp:     { label: "C#",         ext: "cs",   badge: "C#", color: "#ec4899", runner: "ai"     },
  java:       { label: "Java",       ext: "java", badge: "JV", color: "#ef4444", runner: "ai"     },
};

/* ═══════════════════════════════════════════════════
   STARTER TEMPLATES
═══════════════════════════════════════════════════ */
const TEMPLATES = {
  python: `# Python 3.11
def greet(name):
    return f"Hello, {name}!"

for i in range(1, 6):
    print(f"{i}: {greet('World')}")
`,
  javascript: `// JavaScript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 8; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
  typescript: `// TypeScript
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}! Age: \${user.age}\`;
}

const user: User = { name: "Alice", age: 30 };
console.log(greet(user));
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
    .card {
      background: white;
      padding: 40px 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 { color: #1a1a2e; margin: 0 0 10px; }
    p  { color: #666; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, World!</h1>
    <p>HTML + CSS running live.</p>
  </div>
</body>
</html>`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : nums) {
        sum += n;
        cout << "num: " << n << endl;
    }
    cout << "Sum = " << sum << endl;
    return 0;
}`,
  csharp: `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        var fruits = new List<string> { "Apple", "Banana", "Cherry" };
        foreach (var f in fruits) {
            Console.WriteLine($"Fruit: {f}");
        }
        Console.WriteLine($"Total: {fruits.Count}");
    }
}`,
  java: `import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> langs = Arrays.asList("Java", "Python", "C++");
        for (String lang : langs) {
            System.out.println("Language: " + lang);
        }
        System.out.println("Done!");
    }
}`,
};

const TURTLE_CODE = `import turtle

t = turtle.Turtle()
t.speed(6)
colors = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#3498db","#9b59b6"]
for i in range(60):
    t.color(colors[i % 6])
    t.forward(i * 3)
    t.right(91)
turtle.done()`;

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const hasTurtle = c => /\bimport\s+turtle\b|from\s+turtle\s+import/.test(c);
const hasInput  = c => /\binput\s*\(/.test(c);

const getPrompts = c => {
  const r = [];
  const re = /\binput\s*\(\s*(f?(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))?\s*\)/g;
  let m;
  while ((m = re.exec(c)) !== null) {
    if (m[1]) {
      const raw = m[1].replace(/^f?["']|["']$/g, "");
      r.push(raw);
    } else {
      r.push("");
    }
  }
  return r;
};

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ═══════════════════════════════════════════════════
   SYNTAX HIGHLIGHTERS
═══════════════════════════════════════════════════ */
const PY_KW   = new Set(["def","class","import","from","return","if","elif","else","for","while","in","not","and","or","True","False","None","try","except","finally","with","as","pass","break","continue","lambda","yield","async","await","raise","del","global","nonlocal","assert","is"]);
const PY_BT   = new Set(["print","len","range","type","int","str","float","list","dict","set","tuple","input","enumerate","zip","map","filter","sorted","max","min","sum","abs","round","isinstance","super","bool","repr","format","any","all","open","next","iter"]);
const JS_KW   = new Set(["const","let","var","function","return","if","else","for","while","class","import","export","new","true","false","null","undefined","async","await","typeof","instanceof","of","in","do","switch","case","break","continue","throw","try","catch","finally","from","default","extends","static","this","super"]);
const CS_KW   = new Set(["using","namespace","class","public","private","protected","static","void","int","string","bool","float","double","var","new","return","if","else","for","foreach","while","switch","case","break","continue","try","catch","finally","async","await","throw","interface","enum","abstract","override","null","true","false"]);
const JAVA_KW = new Set(["public","private","protected","static","void","int","String","boolean","float","double","class","new","return","if","else","for","while","switch","case","break","continue","try","catch","finally","import","package","extends","implements","interface","enum","abstract","final","null","true","false","this","super"]);
const CPP_KW  = new Set(["int","float","double","char","bool","void","string","auto","const","static","return","if","else","for","while","do","switch","case","break","continue","class","struct","namespace","using","new","delete","nullptr","true","false","public","private","protected","virtual","override","template","typename","sizeof","enum","cout","cin","endl"]);

function findCommentIndex(line) {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = line[i - 1];
    if (ch === "'" && !inDouble && prev !== "\\") inSingle = !inSingle;
    if (ch === '"' && !inSingle && prev !== "\\") inDouble = !inDouble;
    if (ch === "#" && !inSingle && !inDouble) return i;
  }
  return -1;
}

function hlCode(lang, code) {
  if (!code) return `<span style="color:#aaa">// Start typing...</span>`;
  const numColor = "#c18401", strColor = "#008000", cmtColor = "#888", kwColor2 = "#7c00d3";

  if (lang === "python") {
    let h = "";
    code.split("\n").forEach((line, li, arr) => {
      const ci = findCommentIndex(line);
      const cp = ci >= 0 ? line.slice(0, ci) : line;
      const cm = ci >= 0 ? line.slice(ci) : "";
      const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
      let m;
      while ((m = re.exec(cp)) !== null) {
        const w = m[0], e = esc(w);
        if (/^\s+$/.test(w))        { h += e; continue; }
        if (w[0]==='"'||w[0]==="'") { h += `<span style="color:${strColor}">${e}</span>`; continue; }
        if (/^\d/.test(w))          { h += `<span style="color:${numColor}">${e}</span>`; continue; }
        if (PY_KW.has(w))           { h += `<span style="color:${kwColor2};font-weight:700">${e}</span>`; continue; }
        if (PY_BT.has(w))           { h += `<span style="color:#0070c1;font-weight:600">${e}</span>`; continue; }
        h += `<span style="color:#1e1e1e">${e}</span>`;
      }
      if (cm) h += `<span style="color:${cmtColor};font-style:italic">${esc(cm)}</span>`;
      if (li < arr.length - 1) h += "\n";
    });
    return h;
  }

  let kwSet, commentStr, kwColor;
  switch (lang) {
    case "javascript": case "typescript": kwSet = JS_KW;   commentStr = "//"; kwColor = "#7c00d3"; break;
    case "csharp":                        kwSet = CS_KW;   commentStr = "//"; kwColor = "#7c00d3"; break;
    case "java":                          kwSet = JAVA_KW; commentStr = "//"; kwColor = "#7c00d3"; break;
    case "cpp":                           kwSet = CPP_KW;  commentStr = "//"; kwColor = "#7c00d3"; break;
    default: return esc(code);
  }

  let h = "";
  code.split("\n").forEach((line, li, arr) => {
    const ci = line.indexOf(commentStr);
    const cp = ci >= 0 ? line.slice(0, ci) : line;
    const cm = ci >= 0 ? line.slice(ci) : "";
    const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let m;
    while ((m = re.exec(cp)) !== null) {
      const w = m[0], e = esc(w);
      if (/^\s+$/.test(w))                    { h += e; continue; }
      if (w[0]==='"'||w[0]==="'"||w[0]==='`') { h += `<span style="color:${strColor}">${e}</span>`; continue; }
      if (/^\d/.test(w))                       { h += `<span style="color:${numColor}">${e}</span>`; continue; }
      if (kwSet.has(w))                        { h += `<span style="color:${kwColor};font-weight:700">${e}</span>`; continue; }
      h += `<span style="color:#1e1e1e">${e}</span>`;
    }
    if (cm) h += `<span style="color:${cmtColor};font-style:italic">${esc(cm)}</span>`;
    if (li < arr.length - 1) h += "\n";
  });
  return h;
}

/* ═══════════════════════════════════════════════════
   FIX 1: TURTLE HTML — Proper canvas sizing + wait for DOM
═══════════════════════════════════════════════════ */
function makeTurtleHTML(code) {
  const escaped = code.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#1e2127;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    min-height:100vh;
    gap:12px;
    font-family:'Segoe UI',sans-serif;
  }
  #turtle-canvas-container canvas {
    border-radius:12px;
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    max-width:95vw;
    max-height:75vh;
  }
  #st {
    color:#98c379;font-size:13px;font-weight:600;
    padding:5px 16px;background:rgba(152,195,121,0.1);
    border-radius:20px;border:1px solid rgba(152,195,121,0.3);
  }
  #er {
    color:#e06c75;font-size:12px;max-width:90vw;
    word-break:break-word;text-align:center;
    padding:8px 16px;background:rgba(224,108,117,0.1);
    border-radius:8px;border:1px solid rgba(224,108,117,0.3);
    display:none;
  }
  .loader {
    width:14px;height:14px;
    border:2px solid rgba(97,175,239,0.2);
    border-top-color:#61afef;
    border-radius:50%;
    animation:spin 0.8s linear infinite;
    display:inline-block;vertical-align:middle;margin-right:6px;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="st"><span class="loader" id="ld"></span>Loading Skulpt...</div>
<div id="turtle-canvas-container"></div>
<div id="er"></div>
<script>
function showErr(msg) {
  document.getElementById('er').textContent = msg;
  document.getElementById('er').style.display = 'block';
  document.getElementById('st').textContent = 'Error';
  document.getElementById('ld').style.display = 'none';
}
function loadScript(src, cb) {
  var s = document.createElement('script');
  s.src = src;
  s.onload = cb;
  s.onerror = function() { showErr('Failed to load: ' + src); };
  document.head.appendChild(s);
}
window.addEventListener('load', function() {
  loadScript('https://skulpt.org/js/skulpt.min.js', function() {
    loadScript('https://skulpt.org/js/skulpt-stdlib.js', function() {
      document.getElementById('ld').style.display = 'none';
      document.getElementById('st').textContent = 'Running...';
      try {
        Sk.configure({
          output: function() {},
          read: function(f) {
            if (!Sk.builtinFiles || !Sk.builtinFiles.files[f])
              throw 'File not found: ' + f;
            return Sk.builtinFiles.files[f];
          }
        });
        Sk.TurtleGraphics = {
          target: 'turtle-canvas-container',
          width: 480,
          height: 480
        };
        Sk.misceval.asyncToPromise(function() {
          return Sk.importMainWithBody('<stdin>', false, \`${escaped}\`, true);
        }).then(function() {
          document.getElementById('st').textContent = '✓ Done';
        }).catch(function(e) {
          showErr(e.toString());
        });
      } catch(e) {
        showErr(e.toString());
      }
    });
  });
});
<\/script>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════
   FIX 2: WEB WORKER PYTHON RUNNER (while True support)
   Pyodide runs in a Web Worker so main thread never freezes
═══════════════════════════════════════════════════ */

// Worker script as a Blob URL
function createPyWorkerURL() {
  const workerCode = `
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js');

let pyodide = null;

async function initPyodide() {
  self.postMessage({ type: 'progress', pct: 10, msg: 'Downloading Python runtime...' });
  pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/' });
  self.postMessage({ type: 'progress', pct: 60, msg: 'Loading packages...' });
  try { await pyodide.loadPackage(['micropip']); } catch(_) {}
  self.postMessage({ type: 'progress', pct: 100, msg: 'Ready' });
  self.postMessage({ type: 'ready' });
}

initPyodide().catch(e => {
  self.postMessage({ type: 'error', text: 'Pyodide load failed: ' + e.message });
});

self.onmessage = async function(e) {
  const { code, inputs, id } = e.data;
  if (!pyodide) {
    self.postMessage({ type: 'run_error', id, text: 'Python not ready yet' });
    return;
  }
  try {
    // Reset stdout/stderr capture
    pyodide.runPython(\`
import sys, io, builtins
_out_lines = []
_err_lines = []
class _Writer(io.TextIOBase):
    def __init__(self, buf): self._buf = buf
    def write(self, s):
        if s:
            self._buf.append(str(s))
        return len(s)
    def flush(self): pass
sys.stdout = _Writer(_out_lines)
sys.stderr = _Writer(_err_lines)
\`);

    // Install missing packages
    const BUILTIN = new Set(['sys','io','os','re','math','json','time','random','datetime',
      'collections','itertools','functools','string','pathlib','builtins','abc','copy',
      'typing','enum','hashlib','base64','struct','array','heapq','bisect','gc','inspect',
      'traceback','warnings','logging','csv','sqlite3','glob','tempfile','calendar','pprint',
      'textwrap','ast','unittest','asyncio','subprocess','socket','http','html','xml',
      'email','urllib','zipfile','gzip','shutil','stat','platform','decimal','fractions',
      'statistics','cmath','operator','codecs']);
    const re2 = /^(?:import|from)\\s+([\\w]+)/gm;
    const toInstall = new Set(); let m2;
    while ((m2 = re2.exec(code)) !== null) {
      const p = m2[1]; if (!BUILTIN.has(p)) toInstall.add(p);
    }
    if (toInstall.size > 0) {
      self.postMessage({ type: 'output', id, text: 'Installing: ' + [...toInstall].join(', ') + '...', kind: 'system' });
      try {
        await pyodide.runPythonAsync(
          'import micropip\\nfor _p in ' + JSON.stringify([...toInstall]) +
          ':\\n    try: await micropip.install(_p)\\n    except: pass'
        );
        self.postMessage({ type: 'output', id, text: 'Packages ready ✓', kind: 'system' });
      } catch(_) {}
    }

    // Set up input
    if (inputs && inputs.length > 0) {
      pyodide.globals.set('_stdin_data', pyodide.toPy(inputs));
      pyodide.runPython(\`
import sys, io
_sin = list(_stdin_data); _si = 0
class _Reader(io.TextIOBase):
    def readline(self):
        global _si
        if _si < len(_sin):
            v = _sin[_si]; _si += 1; return str(v) + '\\\\n'
        return ''
def _inp(p=''):
    if p: sys.stdout.write(str(p)); sys.stdout.flush()
    return sys.stdin.readline().rstrip('\\\\n')
sys.stdin = _Reader()
builtins.input = _inp
\`);
    }

    // MAX_LINES guard to prevent infinite output flood
    const MAX_LINES = 2000;
    let lineCount = 0;
    let truncated = false;

    // Run with streaming output using a chunk approach
    // We inject a print wrapper that sends lines back as they're produced
    pyodide.globals.set('_post_line', (line) => {
      if (lineCount >= MAX_LINES) { truncated = true; return; }
      lineCount++;
      self.postMessage({ type: 'output', id, text: String(line), kind: 'output' });
    });

    // Patch stdout to send lines immediately via postMessage
    pyodide.runPython(\`
import sys, io
class _StreamWriter(io.TextIOBase):
    def __init__(self):
        self._buf = ''
    def write(self, s):
        if not s: return 0
        self._buf += s
        while '\\\\n' in self._buf:
            line, self._buf = self._buf.split('\\\\n', 1)
            _post_line(line)
        return len(s)
    def flush(self):
        if self._buf:
            _post_line(self._buf)
            self._buf = ''
sys.stdout = _StreamWriter()
\`);

    let runErr = false, errMsg = '';
    try {
      await pyodide.runPythonAsync(code);
      // Flush remaining
      pyodide.runPython('sys.stdout.flush()');
    } catch(ex) {
      runErr = true;
      errMsg = String(ex).replace(/^PythonError:\\s*/, '').trim();
    }

    const errLines = pyodide.globals.get('_err_lines').toJs();
    if (errLines && errLines.length) {
      self.postMessage({ type: 'output', id, text: errLines.join('').trimEnd(), kind: 'error' });
    }
    if (runErr) {
      self.postMessage({ type: 'output', id, text: errMsg, kind: 'error' });
    }
    if (truncated) {
      self.postMessage({ type: 'output', id, text: '[Output truncated at ' + MAX_LINES + ' lines]', kind: 'system' });
    }
    self.postMessage({ type: 'done', id });
  } catch(ex) {
    self.postMessage({ type: 'output', id, text: 'Error: ' + ex.message, kind: 'error' });
    self.postMessage({ type: 'done', id });
  }
};
`;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

// Worker singleton manager
let _workerURL = null;
let _worker = null;
let _workerReady = false;
let _workerReadyCallbacks = [];
let _workerProgress = null;
let _runCallbacks = {};

function getWorker(onProgress) {
  if (!_workerURL) _workerURL = createPyWorkerURL();
  if (!_worker) {
    _worker = new Worker(_workerURL);
    _worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        _workerProgress?.(msg.pct, msg.msg);
      } else if (msg.type === 'ready') {
        _workerReady = true;
        _workerReadyCallbacks.forEach(cb => cb());
        _workerReadyCallbacks = [];
      } else if (msg.type === 'output') {
        _runCallbacks[msg.id]?.onLine?.(msg.text, msg.kind);
      } else if (msg.type === 'done') {
        _runCallbacks[msg.id]?.onDone?.();
        delete _runCallbacks[msg.id];
      } else if (msg.type === 'error') {
        _runCallbacks[msg.id]?.onLine?.(msg.text, 'error');
        _runCallbacks[msg.id]?.onDone?.();
        delete _runCallbacks[msg.id];
      }
    };
    _worker.onerror = (e) => {
      console.error('Worker error:', e);
    };
  }
  _workerProgress = onProgress;
  return _worker;
}

function runPythonInWorker({ code, inputs, onProgress, onLine, onDone }) {
  const worker = getWorker(onProgress);
  const id = Math.random().toString(36).slice(2);
  _runCallbacks[id] = { onLine, onDone };

  const doRun = () => {
    worker.postMessage({ code, inputs, id });
  };

  if (_workerReady) {
    doRun();
  } else {
    _workerReadyCallbacks.push(doRun);
    if (!_workerProgress) _workerProgress = onProgress;
  }
  return id;
}

function terminateWorker() {
  if (_worker) {
    _worker.terminate();
    _worker = null;
    _workerReady = false;
    _workerURL = null;
    _runCallbacks = {};
    _workerProgress = null;
  }
}

/* ═══════════════════════════════════════════════════
   CODE EDITOR
═══════════════════════════════════════════════════ */
function CodeEditor({ code, onChange, lang }) {
  const taRef = useRef(null);
  const hiRef = useRef(null);
  const lines = (code || "").split("\n");
  const lineCount = lines.length;
  const FS = 14, LH = 22;
  const digits = String(lineCount).length;
  const LNW = Math.max(18, digits * 6 + 6);
  const lnRef = useRef(null);

  const syncScroll = () => {
    if (!taRef.current) return;
    const top = taRef.current.scrollTop;
    const left = taRef.current.scrollLeft;
    if (hiRef.current) { hiRef.current.scrollTop = top; hiRef.current.scrollLeft = left; }
    if (lnRef.current)  { lnRef.current.scrollTop = top; }
  };

  const onKeyDown = (e) => {
    const ta = taRef.current; if (!ta) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "a") return;
    if ((e.ctrlKey || e.metaKey) && e.key === "c") return;
    const s = ta.selectionStart, end = ta.selectionEnd, v = code;
    if (e.key === "Backspace" && s === end) {
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const seg = v.slice(ls, s);
      if (/^ +$/.test(seg) && seg.length % 4 === 0 && seg.length > 0) {
        e.preventDefault();
        onChange(v.slice(0, s - 4) + v.slice(s));
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s - 4; });
        return;
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      onChange(v.slice(0, s) + "    " + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const lead = v.slice(ls, s).match(/^(\s*)/)[1].length;
      const needsIndent = /[:{\(]$/.test(v.slice(ls, s).trimEnd());
      const ind = " ".repeat(lead + (needsIndent ? 4 : 0));
      onChange(v.slice(0, s) + "\n" + ind + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1 + ind.length; });
    }
  };

  const guides = useMemo(() => {
    const result = [];
    lines.forEach((line, li) => {
      if (line.trim() === "") return;
      const spaces = line.match(/^(\s*)/)[1].length;
      const levels = Math.floor(spaces / 4);
      for (let gi = 0; gi < levels; gi++) {
        result.push(
          <div key={`g${li}-${gi}`} style={{
            position: "absolute",
            left: LNW + 12 + gi * 4 * (FS * 0.605),
            top: 12 + li * LH,
            width: 1, height: LH,
            background: "rgba(0,0,0,0.08)",
            pointerEvents: "none", zIndex: 1,
          }} />
        );
      }
    });
    return result;
  }, [code, LNW]); // eslint-disable-line react-hooks/exhaustive-deps

  const shared = {
    position: "absolute", inset: 0,
    padding: `12px 12px 12px ${LNW + 8}px`,
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: FS, lineHeight: LH + "px",
    whiteSpace: "pre", overflow: "hidden", tabSize: 4,
  };

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#ffffff" }}>
      <div ref={lnRef} style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: LNW,
        background: "#f8f8f8", borderRight: "1px solid #ebebeb",
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9, lineHeight: LH + "px",
        overflowY: "hidden", overflowX: "hidden",
        pointerEvents: "none", zIndex: 3, userSelect: "none",
        paddingTop: 12, paddingBottom: 12,
      }}>
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} style={{ textAlign: "right", paddingRight: 4, color: "#ccc", height: LH }}>{i + 1}</div>
        ))}
      </div>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
        {guides}
      </div>

      <div ref={hiRef} style={{
        ...shared,
        pointerEvents: "none", zIndex: 2, color: "#1e1e1e", wordBreak: "normal",
        overflow: "hidden",
      }}>
        <pre style={{
          margin: 0, padding: 0,
          fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
          fontSize: FS, lineHeight: LH + "px",
          background: "transparent", whiteSpace: "pre", wordBreak: "normal",
        }} dangerouslySetInnerHTML={{ __html: hlCode(lang, code) }} />
      </div>

      <textarea
        ref={taRef} value={code}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={onKeyDown}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{
          ...shared,
          background: "transparent", color: "transparent",
          caretColor: "#000000", border: "none", outline: "none", resize: "none",
          zIndex: 4, WebkitTextFillColor: "transparent", wordBreak: "normal",
          overflowY: "scroll", overflowX: "auto",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   OUTPUT PANEL — FIX 3: Stop button + output throttling
═══════════════════════════════════════════════════ */
function OutputPanel({ lines, isRunning, onClose, onStop, inputPrompt, onInputSubmit, langLabel }) {
  const bottomRef = useRef(null);
  const [inputVal, setInputVal] = useState("");
  const [termCopied, setTermCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 30);
  }, [lines]);

  const submit = () => {
    const v = inputVal.trim(); if (!v) return;
    onInputSubmit(v); setInputVal("");
  };

  const copyOutput = async () => {
    const text = lines.map(l => {
      const prefix = l.type === "error" ? "✖ " : l.type === "system" ? "● " : "";
      return prefix + l.text;
    }).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setTermCopied(true);
      setTimeout(() => setTermCopied(false), 1500);
    } catch (_) {}
  };

  const lineStyle = (line) => {
    switch (line.type) {
      case "error":   return { color: "#ff0000" };
      case "system":  return { color: "#888", fontStyle: "italic" };
      case "input":   return { color: "#c18401" };
      case "keyword": return { color: "#7c00d3" };
      case "result":  return { color: "#0070c1" };
      default:        return { color: "#1e1e1e" };
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{
        background: "#f5f5f5", borderBottom: "1px solid #e0e0e0",
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#27c93f" }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#555", marginLeft: 4 }}>
          PySkill Terminal — {langLabel || "Output"}
        </span>
        {isRunning && (
          <span style={{ fontSize: 11, color: "#0070c1", display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#0070c1", animation: "blink 1s infinite" }} />
            Running
          </span>
        )}
        {/* STOP button — terminates while True loops */}
        {isRunning && (
          <button onClick={onStop} style={{
            background: "#ff4444", border: "none", color: "#fff",
            borderRadius: 7, padding: "5px 12px", fontSize: 11,
            cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
          }}>
            ■ Stop
          </button>
        )}
        <button onClick={copyOutput} style={{
          marginLeft: isRunning ? 0 : "auto",
          background: termCopied ? "#f0fdf4" : "#fff",
          border: `1px solid ${termCopied ? "#bbf7d0" : "#ddd"}`,
          color: termCopied ? "#16a34a" : "#555",
          borderRadius: 7, padding: "5px 10px", fontSize: 11,
          cursor: "pointer", transition: "all 0.2s",
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          {termCopied ? "✓ Copied!" : "⎘ Copy"}
        </button>
        {!isRunning && <div style={{ flex: 1 }} />}
        <button onClick={onClose} style={{
          background: "#fff", border: "1px solid #ddd", color: "#555",
          borderRadius: 7, padding: "5px 14px", fontSize: 12, cursor: "pointer",
        }}>✕ Close</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", background: "#ffffff", userSelect: "text", WebkitUserSelect: "text" }}>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
          color: "#aaa", marginBottom: 8, borderBottom: "1px solid #f0f0f0", paddingBottom: 8,
          userSelect: "none",
        }}>
          {langLabel} · PySkill Compiler ───────────────
        </div>
        {isRunning && lines.length === 0 && (
          <span style={{ color: "#888", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>▶ Running...</span>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 13, lineHeight: "1.85",
            ...lineStyle(line),
            whiteSpace: "pre-wrap", wordBreak: "break-all",
            paddingLeft: line.type === "error" ? 10 : 0,
            borderLeft: line.type === "error" ? "2px solid #ff0000" : "none",
            userSelect: "text", WebkitUserSelect: "text",
          }}>
            {line.type === "error" ? "✖ " : line.type === "system" ? "● " : ""}{line.text}
          </div>
        ))}
        {inputPrompt !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ color: "#c18401", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
              {inputPrompt || "▶"}
            </span>
            <input
              autoFocus value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{
                flex: 1, background: "#f5f5f5", border: "1px solid #ddd",
                color: "#1e1e1e", borderRadius: 7, padding: "7px 12px",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 13, outline: "none",
              }}
            />
            <button onClick={submit} style={{
              background: "#0070c1", border: "none", color: "#fff",
              borderRadius: 7, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13,
            }}>↵</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TURTLE SCREEN
═══════════════════════════════════════════════════ */
function TurtleScreen({ html, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#1e2127" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 46,
        background: "#f5f5f5", borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", padding: "0 16px", zIndex: 1,
      }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: "#1e1e1e" }}>🐢 Turtle Graphics</span>
        <button onClick={onClose} style={{
          marginLeft: "auto", background: "#fff", border: "1px solid #ddd", color: "#555",
          borderRadius: 7, padding: "6px 16px", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer",
        }}>← Back</button>
      </div>
      <iframe
        title="turtle"
        srcDoc={html}
        sandbox="allow-scripts"
        style={{ width: "100%", height: "100%", border: "none", paddingTop: 46 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HTML PREVIEW SCREEN
═══════════════════════════════════════════════════ */
function HTMLScreen({ html, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 46,
        background: "#f5f5f5", borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", padding: "0 16px", zIndex: 1,
      }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: "#1e1e1e" }}>🌐 HTML Preview</span>
        <button onClick={onClose} style={{
          marginLeft: "auto", background: "#fff", border: "1px solid #ddd", color: "#555",
          borderRadius: 7, padding: "6px 16px", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer",
        }}>← Back</button>
      </div>
      <iframe title="html-preview" srcDoc={html} style={{ width: "100%", height: "100%", border: "none", paddingTop: 46 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PYTHON LOAD OVERLAY
═══════════════════════════════════════════════════ */
function PyLoadOverlay({ progress, msg }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(255,255,255,0.97)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: "#f0f7ff", border: "1px solid #bfdbfe",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>🐍</div>
      <div style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, color: "#1e1e1e" }}>
        {msg || "Loading Python..."}
      </div>
      <div style={{ width: 220, background: "#e0e0e0", borderRadius: 10, height: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: progress + "%",
          background: "linear-gradient(90deg,#0070c1,#008000)",
          borderRadius: 10, transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#aaa" }}>First time only — then instant ⚡</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App({ setCurrentPage, initialCode }) {
  const [lang,        setLang]       = useState("python");
  const [code,        setCode]       = useState(initialCode || TEMPLATES.python);
  const [screen,      setScreen]     = useState("editor");
  const [langOpen,    setLangOpen]   = useState(false);
  const [termLines,   setTermLines]  = useState([]);
  const [termRunning, setTermRunning]= useState(false);
  const [inputPrompt, setInputPrompt]= useState(null);
  const [turtleHTML,  setTurtleHTML] = useState("");
  const [htmlSrc,     setHtmlSrc]    = useState("");
  const [pyLoading,   setPyLoading]  = useState(false);
  const [pyProgress,  setPyProgress] = useState(0);
  const [pyMsg,       setPyMsg]      = useState("");
  const [hasError,    setHasError]   = useState(false);
  const [lastError,   setLastError]  = useState("");
  const [isFixing,    setIsFixing]   = useState(false);
  const [fixMsg,      setFixMsg]     = useState("");
  const [copyDone,    setCopyDone]   = useState(false);

  const inputResolveRef = useRef(null);
  // FIX: Buffer lines to avoid setState flood from while True
  const lineBufferRef   = useRef([]);
  const flushTimerRef   = useRef(null);

  useEffect(() => { if (initialCode) setCode(initialCode); }, [initialCode]);

  // Pre-init worker on mount
  useEffect(() => {
    getWorker((pct, msg) => {
      setPyProgress(pct);
      setPyMsg(msg);
      if (pct < 100) setPyLoading(true);
      else setPyLoading(false);
    });
  }, []);

  // Batched line flusher — prevents render flood
  const flushLines = useCallback(() => {
    if (lineBufferRef.current.length === 0) return;
    const toAdd = lineBufferRef.current.splice(0);
    setTermLines(p => {
      const next = [...p, ...toAdd];
      // Cap at 3000 lines in UI
      if (next.length > 3000) return next.slice(next.length - 3000);
      return next;
    });
  }, []);

  const addLine = useCallback((text, type = "output") => {
    lineBufferRef.current.push({ text, type });
    if (type === "error") {
      setHasError(true);
      setLastError(prev => prev ? prev + "\n" + text : text);
    }
    clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flushLines, 50); // batch every 50ms
  }, [flushLines]);

  const waitForInput = useCallback((prompt) => {
    return new Promise(resolve => { setInputPrompt(prompt); inputResolveRef.current = resolve; });
  }, []);

  const handleInputSubmit = useCallback((val) => {
    setInputPrompt(null);
    addLine(val, "input");
    inputResolveRef.current?.(val);
    inputResolveRef.current = null;
  }, [addLine]);

  // STOP: Kill worker
  const handleStop = useCallback(() => {
    terminateWorker();
    // Re-init worker for next run
    getWorker((pct, msg) => {
      setPyProgress(pct); setPyMsg(msg);
      if (pct < 100) setPyLoading(true);
      else setPyLoading(false);
    });
    addLine("⚠ Execution stopped by user.", "system");
    setTermRunning(false);
  }, [addLine]);

  const switchLang = (k) => {
    setLang(k); setCode(TEMPLATES[k]); setLangOpen(false);
    setHasError(false); setLastError(""); setFixMsg("");
    setScreen("editor"); setTermLines([]);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard?.writeText(code); setCopyDone(true); setTimeout(() => setCopyDone(false), 1500); } catch (_) {}
  };

  /* ── AI FIX ── */
  const doFix = useCallback(async () => {
    if (!lastError || isFixing) return;
    setIsFixing(true); setFixMsg("AI is analyzing the error...");
    try {
      const langLabel = LANGS[lang]?.label || lang;
      let reply = "";
      await callAI([
        { role: "system", content: `You are an expert ${langLabel} developer. Fix the buggy code. Return ONLY the corrected code inside a markdown code block (\`\`\`${lang}\n...\n\`\`\`). No explanation, no extra text.` },
        { role: "user",   content: `${langLabel} code with error:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nError message:\n${lastError}\n\nReturn only the fixed code block.` },
      ], (partial) => { reply = partial; });
      const match = reply.match(/```(?:\w+)?\n([\s\S]+?)```/);
      if (match) {
        setCode(match[1].trim()); setHasError(false); setLastError("");
        setFixMsg("✓ Fixed! Run again to verify."); setTimeout(() => setFixMsg(""), 4000);
      } else {
        setFixMsg("Could not auto-fix. Please check manually."); setTimeout(() => setFixMsg(""), 5000);
      }
    } catch (e) {
      setFixMsg("AI unavailable: " + e.message); setTimeout(() => setFixMsg(""), 5000);
    }
    setIsFixing(false);
  }, [lang, code, lastError, isFixing]);

  /* ── RUN CODE ── */
  const runCode = useCallback(async (codeToRun) => {
    const raw = (codeToRun ?? code).trim();
    if (!raw) return;
    const runner = LANGS[lang]?.runner || "pyodide";
    setHasError(false); setLastError(""); setFixMsg("");

    if (runner === "html") { setHtmlSrc(raw); setScreen("html"); return; }
    if (runner === "pyodide" && hasTurtle(raw)) { setTurtleHTML(makeTurtleHTML(raw)); setScreen("turtle"); return; }

    setTermLines([]); lineBufferRef.current = [];
    setTermRunning(true); setScreen("output");

    if (runner === "eval") {
      const logs = [];
      const oL = console.log, oE = console.error, oW = console.warn;
      console.log   = (...a) => logs.push({ t: "output", v: a.map(x => typeof x === "object" ? JSON.stringify(x, null, 2) : String(x)).join(" ") });
      console.error = (...a) => logs.push({ t: "error",  v: a.map(String).join(" ") });
      console.warn  = (...a) => logs.push({ t: "output", v: a.map(String).join(" ") });
      try {
        if (/\bawait\b/.test(raw)) {
          // eslint-disable-next-line no-new-func
          await (new Function("return (async () => { " + raw + " })()")());
        } else {
          eval(raw); // eslint-disable-line no-eval
        }
      } catch (e) { logs.push({ t: "error", v: e.message }); }
      console.log = oL; console.error = oE; console.warn = oW;
      if (logs.length) logs.forEach(l => addLine(l.v, l.t));
      else addLine("Done (no output)", "system");
      setTermRunning(false); return;
    }

    if (runner === "ai") {
      try {
        const langLabel = LANGS[lang]?.label || lang;
        let out = "";
        await callAI([
          { role: "system", content: `Simulate the exact console output of this ${langLabel} program. Return ONLY the raw output lines. No markdown, no explanation.` },
          { role: "user",   content: raw },
        ], (partial) => { out = partial; });
        if (out.trim()) out.trim().split("\n").forEach(l => addLine(l));
        else addLine("Done (no output)", "system");
      } catch (e) { addLine("AI unavailable: " + e.message, "error"); }
      setTermRunning(false); return;
    }

    // PYODIDE via Web Worker
    if (runner === "pyodide") {
      // Collect inputs first if needed
      let inputs = [];
      if (hasInput(raw)) {
        const prompts = getPrompts(raw);
        for (const p of prompts) {
          const val = await waitForInput(p);
          inputs.push(val);
        }
        setInputPrompt(null);
      }

      let gotOutput = false;
      runPythonInWorker({
        code: raw,
        inputs,
        onProgress: (pct, msg) => {
          setPyProgress(pct); setPyMsg(msg);
          setPyLoading(pct < 100);
        },
        onLine: (text, kind) => {
          gotOutput = true;
          // Split multi-line text
          text.split("\n").forEach(l => addLine(l, kind));
        },
        onDone: () => {
          // Final flush
          clearTimeout(flushTimerRef.current);
          flushLines();
          if (!gotOutput) addLine("Done (no output)", "system");
          setTermRunning(false);
          setPyLoading(false);
        },
      });
    }
  }, [code, lang, addLine, waitForInput, flushLines]);

  const handleBack = () => {
    if (typeof setCurrentPage === "function") setCurrentPage("home");
    else window.history.back();
  };

  const cl = LANGS[lang];
  if (screen === "turtle") return <TurtleScreen html={turtleHTML} onClose={() => setScreen("editor")} />;
  if (screen === "html")   return <HTMLScreen   html={htmlSrc}    onClose={() => setScreen("editor")} />;
  if (screen === "output") return (
    <>
      {pyLoading && <PyLoadOverlay progress={pyProgress} msg={pyMsg} />}
      <OutputPanel
        lines={termLines} isRunning={termRunning}
        onClose={() => { setScreen("editor"); setTermRunning(false); }}
        onStop={handleStop}
        inputPrompt={inputPrompt} onInputSubmit={handleInputSubmit}
        langLabel={cl.label}
      />
    </>
  );

  /* EDITOR SCREEN */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#ffffff", overflow: "hidden" }}>

      {/* ROW 1: Back + Title + Lang selector + Run */}
      <div style={{
        height: 46, background: "#f5f5f5", borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", padding: "0 10px", gap: 8, flexShrink: 0,
      }}>
        <button onClick={handleBack} style={{
          background: "#fff", border: "1px solid #ddd", color: "#555", borderRadius: 8,
          padding: "5px 10px", fontSize: 12, cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif",
          display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
        }}>← Back</button>

        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800,
          letterSpacing: "-0.4px", flexShrink: 0, color: "#1e1e1e", whiteSpace: "nowrap",
        }}>
          Py<span style={{ color: "#0070c1" }}>Skill</span>
          <span style={{
            marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#888",
            letterSpacing: "0.5px", textTransform: "uppercase", verticalAlign: "middle",
          }}>Compiler</span>
        </span>

        <div style={{ flex: 1 }} />

        {/* Language selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setLangOpen(o => !o)} style={{
            display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #ddd",
            borderRadius: 8, padding: "5px 8px", fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11, fontWeight: 700, color: "#333", cursor: "pointer", flexShrink: 0,
          }}>
            <span style={{ width: 20, height: 20, borderRadius: 4, background: cl.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{cl.badge}</span>
            {cl.label}
            <span style={{ fontSize: 9, color: "#aaa" }}>▾</span>
          </button>
          {langOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden", minWidth: 165 }}>
              {Object.entries(LANGS).map(([k, v]) => (
                <button key={k} onClick={() => switchLang(k)} style={{
                  width: "100%", padding: "10px 14px", background: lang === k ? "#f5f5f5" : "transparent",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "sans-serif", fontSize: 13, fontWeight: lang === k ? 700 : 400,
                  color: lang === k ? "#1e1e1e" : "#555", textAlign: "left",
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: 5, background: v.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{v.badge}</span>
                  {v.label}
                  {lang === k && <span style={{ marginLeft: "auto", color: v.color }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => runCode(code)} className="run-btn-live" style={{
          border: "none", color: "#fff", borderRadius: 9, padding: "7px 16px",
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif",
          display: "flex", alignItems: "center", gap: 5,
          letterSpacing: "0.2px", flexShrink: 0,
          textShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}>
          <span style={{ fontSize: 10 }}>▶</span> Run
        </button>
      </div>

      {/* AI FIX BANNER */}
      {(hasError || fixMsg) && (
        <div style={{
          background: !hasError && fixMsg ? "#f0fdf4" : "#fff5f5",
          borderBottom: "1px solid " + (!hasError && fixMsg ? "#bbf7d0" : "#fecaca"),
          padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: !hasError && fixMsg ? "#22c55e" : "#ff0000" }} />
          <span style={{ fontSize: 12, fontFamily: "sans-serif", flex: 1, color: !hasError && fixMsg ? "#16a34a" : "#cc0000" }}>
            {fixMsg || `${cl.label} error detected`}
          </span>
          {hasError && !isFixing && (
            <button onClick={doFix} style={{ background: "#ff0000", border: "none", color: "#fff", borderRadius: 7, padding: "5px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              🔧 AI Fix
            </button>
          )}
          {isFixing && (
            <span style={{ fontSize: 11, color: "#0070c1", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#0070c1", animation: "blink 0.8s infinite" }} />
              Fixing...
            </span>
          )}
          {!hasError && fixMsg && (
            <button onClick={() => setFixMsg("")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 15 }}>×</button>
          )}
        </div>
      )}

      {/* CODE EDITOR */}
      <CodeEditor code={code} onChange={setCode} lang={lang} />

      {/* BOTTOM BAR */}
      <div style={{
        height: 44, background: "#f5f5f5", borderTop: "1px solid #e0e0e0",
        display: "flex", alignItems: "center", padding: "0 12px", gap: 6, flexShrink: 0,
      }}>
        <button onClick={() => { setCode(""); setHasError(false); setLastError(""); setFixMsg(""); }} style={{
          background: "#fff", border: "1px solid #ddd", color: "#555",
          borderRadius: 7, padding: "5px 11px", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
        }}>Clear</button>

        <button onClick={handleCopy} style={{
          background: copyDone ? "#f0fdf4" : "#fff",
          border: `1px solid ${copyDone ? "#bbf7d0" : "#ddd"}`,
          color: copyDone ? "#16a34a" : "#555",
          borderRadius: 7, padding: "5px 11px", fontSize: 12, cursor: "pointer",
          transition: "all 0.2s", fontFamily: "sans-serif",
        }}>
          {copyDone ? "✓ Copied!" : "Copy"}
        </button>

        {lang === "python" && (
          <button onClick={() => setCode(TURTLE_CODE)} style={{
            background: "#fff", border: "1px solid #ddd", color: "#008000",
            borderRadius: 7, padding: "5px 11px", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
          }}>🐢 Turtle</button>
        )}

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'JetBrains Mono',monospace" }}>PySkill</span>
      </div>

      {langOpen && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setLangOpen(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f5f5f5; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        textarea { -webkit-tap-highlight-color: transparent; }
        input, textarea { font-size: 16px !important; }
        button:active { opacity: 0.85; transform: scale(0.97); }
        body, html { overflow: hidden; position: fixed; width: 100%; height: 100%; background: #fff; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes liveGrad {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .run-btn-live {
          background: linear-gradient(
            270deg,
            #f43f5e, #f97316, #eab308, #22c55e,
            #06b6d4, #6366f1, #a855f7, #ec4899, #f43f5e
          );
          background-size: 400% 400%;
          animation: liveGrad 5s ease infinite;
        }
        .run-btn-live:hover { filter: brightness(1.1); }
        .run-btn-live:active { filter: brightness(0.9); transform: scale(0.97); }
      `}</style>
    </div>
  );
}