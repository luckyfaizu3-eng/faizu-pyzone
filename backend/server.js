const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '🐍 FaizUpyZone Python Compiler Backend!' });
});

// ── Judge0 free public API ──
const JUDGE0 = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

app.post('/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ error: 'No code' });

  try {
    // Try Piston first (glot.io mirror)
    const response = await axios.post(
      'https://glot.io/api/run/python/latest',
      {
        files: [{ name: 'main.py', content: code }],
        stdin: stdin,
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + (process.env.GLOT_TOKEN || ''),
        },
      }
    );
    const { stdout = '', stderr = '' } = response.data;
    return res.json({ stdout, stderr, exitCode: stderr ? 1 : 0 });

  } catch (e1) {
    // Fallback: Piston v2 (different endpoint)
    try {
      const r2 = await axios.post(
        'https://emkc.org/api/v2/piston/execute',
        {
          language: 'python',
          version: '3.10',
          files: [{ name: 'main.py', content: code }],
          stdin: stdin,
        },
        { timeout: 15000 }
      );
      const { run } = r2.data;
      return res.json({
        stdout: run.stdout || '',
        stderr: run.stderr || '',
        exitCode: run.code ?? 0,
      });
    } catch (e2) {
      // Final fallback: Onecompiler API (free, no key)
      try {
        const r3 = await axios.post(
          'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
          {
            language: 'python',
            files: [{ name: 'main.py', content: code }],
            stdin: stdin,
          },
          { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
        );
        const d = r3.data;
        return res.json({
          stdout: d.stdout || '',
          stderr: d.stderr || d.error || '',
          exitCode: d.error ? 1 : 0,
        });
      } catch (e3) {
        return res.status(500).json({
          stdout: '',
          stderr: '❌ All execution servers are unavailable. Please try again.',
          exitCode: 1,
        });
      }
    }
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
  console.log('\n🐍 Python Backend running on http://localhost:' + PORT);
  console.log('   Press Ctrl+C to stop\n');
});