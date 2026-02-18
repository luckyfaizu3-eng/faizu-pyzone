const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '🐍 FaizUpyZone Python Compiler Backend is running!' });
});

app.post('/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'No code provided' });
  }
  try {
    const response = await axios.post(
      'https://emkc.org/api/v2/piston/execute',
      {
        language: 'python',
        version:  '3.10',
        files:    [{ name: 'main.py', content: code }],
        stdin:    stdin,
        run_timeout: 10000,
        compile_timeout: 10000,
      },
      { timeout: 20000, headers: { 'Content-Type': 'application/json' } }
    );
    const { run } = response.data;
    return res.json({
      stdout:   run.stdout  || '',
      stderr:   run.stderr  || '',
      exitCode: run.code    ?? 0,
      time:     run.time    || 0,
    });
  } catch (err) {
    console.error('Piston API error:', err.message);
    return res.status(500).json({
      stdout:   '',
      stderr:   '❌ Server error: ' + (err.response?.data?.message || err.message),
      exitCode: 1,
    });
  }
});

app.post('/check-input', (req, res) => {
  const { code = '' } = req.body;
  const matches = code.match(/\binput\s*\(/g) || [];
  const prompts = [];
  const re = /\binput\s*\(\s*(?:f?["']([^"']*?)["'])?\s*\)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    prompts.push(m[1] || '');
  }
  res.json({ count: matches.length, prompts });
});

app.listen(PORT, () => {
  console.log('\n🐍 Python Backend running on http://localhost:' + PORT);
  console.log('   Press Ctrl+C to stop\n');
});