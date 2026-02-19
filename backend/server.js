require('dotenv').config();   // ✅ .env file load karo

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
// HuggingFace Config
// ═══════════════════════════════════════════════
const HF_KEY   = process.env.REACT_APP_HF_KEY || process.env.HF_KEY || "";
const HF_MODEL = process.env.HF_MODEL || "openai/gpt-oss-120b:groq";
const HF_URL   = "https://router.huggingface.co/v1/chat/completions";

// Check if python3 is available on this system
const PYTHON = (() => {
  try { execSync('python3 --version'); return 'python3'; } catch {}
  try { execSync('python --version'); return 'python'; }  catch {}
  return null;
})();

console.log('Python binary:', PYTHON || 'NOT FOUND');

// ═══════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🐍 FaizUpyZone Backend!',
    python: PYTHON || 'not available',
    hf_model: HF_MODEL,
    hf_key: HF_KEY ? '✅ set' : '❌ missing',
  });
});

// ═══════════════════════════════════════════════
// 🤖 HuggingFace PROXY — fixes CORS
// POST /chat
// Body: { messages: [...], temperature?, max_tokens? }
// ═══════════════════════════════════════════════
app.post('/chat', async (req, res) => {
  if (!HF_KEY) {
    return res.status(500).json({ error: 'HF_KEY not set on server. Add REACT_APP_HF_KEY to .env' });
  }

  const { messages, temperature = 0.7, max_tokens = 800 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const hfRes = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${HF_KEY}`,
      },
      body: JSON.stringify({
        model:       HF_MODEL,
        messages,
        max_tokens,
        temperature,
        stream:      true,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error('HF Error:', hfRes.status, errText);
      return res.status(hfRes.status).json({ error: errText });
    }

    // ── Stream the response straight to the browser ──
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx fix

    const reader = hfRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk); // forward SSE chunks directly
    }

    res.end();

  } catch (err) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ═══════════════════════════════════════════════
// PYTHON COMPILER — unchanged
// ═══════════════════════════════════════════════
app.post('/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ error: 'No code' });

  if (!PYTHON) {
    return res.status(500).json({
      stdout: '',
      stderr: '❌ Python not available on server',
      exitCode: 1,
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
  console.log('   Python:   ' + (PYTHON || 'NOT FOUND'));
  console.log('   HF Model: ' + HF_MODEL);
  console.log('   HF Key:   ' + (HF_KEY ? '✅ set' : '❌ MISSING — add to .env'));
  console.log('   Press Ctrl+C to stop\n');
});