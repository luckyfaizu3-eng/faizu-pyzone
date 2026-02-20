require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const { execSync, spawn } = require('child_process');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// ═══════════════════════════════════════════════
// Groq Config — 7 Keys Auto Rotate
// ═══════════════════════════════════════════════
const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
  process.env.GROQ_KEY_4,
  process.env.GROQ_KEY_5,
  process.env.GROQ_KEY_6,
  process.env.GROQ_KEY_7,
].filter(Boolean);

let keyIndex = 0;

function getNextKey() {
  const key = GROQ_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % GROQ_KEYS.length;
  return key;
}

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"; // sabse fast + smart

// Check if python3 is available
const PYTHON = (() => {
  try { execSync('python3 --version'); return 'python3'; } catch {}
  try { execSync('python --version');  return 'python';  } catch {}
  return null;
})();

console.log('Python binary:', PYTHON || 'NOT FOUND');

// ═══════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    status:      'ok',
    message:     '🐍 FaizUpyZone Backend!',
    python:      PYTHON || 'not available',
    groq_model:  GROQ_MODEL,
    groq_keys:   GROQ_KEYS.length > 0 ? `✅ ${GROQ_KEYS.length} keys loaded` : '❌ missing',
  });
});

// ═══════════════════════════════════════════════
// 🤖 GROQ CHAT PROXY
// POST /chat
// Body: { messages: [...], temperature?, max_tokens? }
// ═══════════════════════════════════════════════
app.post('/chat', async (req, res) => {
  if (GROQ_KEYS.length === 0) {
    return res.status(500).json({ error: 'No GROQ keys set. Add GROQ_KEY_1 to GROQ_KEY_7 in environment.' });
  }

  const { messages, temperature = 0.7, max_tokens = 800 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Try all keys if one fails due to rate limit
  let lastError = null;
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const apiKey = getNextKey();

    try {
      const groqRes = await fetch(GROQ_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:       GROQ_MODEL,
          messages,
          max_tokens,
          temperature,
          stream:      true,
        }),
      });

      // Rate limited — try next key
      if (groqRes.status === 429) {
        console.warn(`Key ${attempt + 1} rate limited, trying next...`);
        lastError = '429 rate limit';
        continue;
      }

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error('Groq Error:', groqRes.status, errText);
        return res.status(groqRes.status).json({ error: errText });
      }

      // Stream response
      res.setHeader('Content-Type',      'text/event-stream');
      res.setHeader('Cache-Control',     'no-cache');
      res.setHeader('Connection',        'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const reader  = groqRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }

      res.end();
      return; // success!

    } catch (err) {
      console.error('Proxy error:', err.message);
      lastError = err.message;
    }
  }

  // All keys failed
  if (!res.headersSent) {
    res.status(429).json({ error: `All ${GROQ_KEYS.length} keys rate limited. Try again later.` });
  }
});

// ═══════════════════════════════════════════════
// PYTHON COMPILER
// ═══════════════════════════════════════════════
app.post('/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ error: 'No code' });

  if (!PYTHON) {
    return res.status(500).json({
      stdout: '', stderr: '❌ Python not available on server', exitCode: 1,
    });
  }

  const tmpFile = path.join(os.tmpdir(), `py_${Date.now()}.py`);

  try {
    fs.writeFileSync(tmpFile, code, 'utf8');

    const result = await new Promise((resolve) => {
      const proc = spawn(PYTHON, [tmpFile]);
      let stdout = '', stderr = '';
      let killed = false;

      if (stdin) { proc.stdin.write(stdin); }
      proc.stdin.end();

      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });

      proc.on('close', code => {
        if (!killed) resolve({ stdout, stderr, exitCode: code ?? 0 });
      });

      proc.on('error', err => {
        resolve({ stdout: '', stderr: '❌ ' + err.message, exitCode: 1 });
      });

      setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
        resolve({ stdout, stderr: (stderr || '') + '\n⏱️ Time limit exceeded (10s)', exitCode: 1 });
      }, 10000);
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ stdout: '', stderr: '❌ ' + err.message, exitCode: 1 });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
});

app.post('/check-input', (req, res) => {
  const { code = '' } = req.body;
  const matches = code.match(/\binput\s*\(/g) || [];
  const prompts = [];
  const re = /\binput\s*\(\s*(?:f?["']([^"']*?)["'])?\s*\)/g;
  let m;
  while ((m = re.exec(code)) !== null) prompts.push(m[1] || '');
  res.json({ count: matches.length, prompts });
});

app.listen(PORT, () => {
  console.log('\n🚀 FaizUpyZone Backend on http://localhost:' + PORT);
  console.log('   Python:    ' + (PYTHON || 'NOT FOUND'));
  console.log('   Groq Model:' + GROQ_MODEL);
  console.log('   Groq Keys: ' + (GROQ_KEYS.length > 0 ? `✅ ${GROQ_KEYS.length} keys loaded` : '❌ MISSING'));
  console.log('   Press Ctrl+C to stop\n');
});