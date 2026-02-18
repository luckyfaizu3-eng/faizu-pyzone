const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '🐍 FaizUpyZone Python Compiler!' });
});

app.post('/run', async (req, res) => {
  const { code, stdin = '' } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ error: 'No code' });

  // ── Wandbox API (free, no key needed) ──
  try {
    const response = await axios.post(
      'https://wandbox.org/api/compile.json',
      {
        compiler: 'cpython-3.12.0',
        code: code,
        stdin: stdin,
        'compiler-option-raw': '',
      },
      { timeout: 20000, headers: { 'Content-Type': 'application/json' } }
    );

    const d = response.data;
    const stdout = d.program_output || d.output || '';
    const stderr = d.program_error || d.compiler_error || '';
    return res.json({ stdout, stderr, exitCode: stderr ? 1 : 0 });

  } catch (e1) {
    console.error('Wandbox error:', e1.message);

    // ── Fallback: tio.run API ──
    try {
      const lang = 'python3';
      const payload = `#lang:${lang}\n#code:${Buffer.from(code).toString('base64')}\n#input:${Buffer.from(stdin).toString('base64')}`;
      
      const r2 = await axios.post(
        'https://tio.run/cgi-bin/run/api/',
        payload,
        { timeout: 20000, headers: { 'Content-Type': 'text/plain' } }
      );
      return res.json({ stdout: r2.data || '', stderr: '', exitCode: 0 });

    } catch (e2) {
      console.error('TIO error:', e2.message);

      // ── Fallback 2: Rextester ──
      try {
        const params = new URLSearchParams();
        params.append('LanguageChoiceWrapper', '24'); // Python 3
        params.append('EditorChoiceWrapper', '1');
        params.append('LayoutChoiceWrapper', '1');
        params.append('Program', code);
        params.append('Input', stdin);
        params.append('CompilerArgs', '');

        const r3 = await axios.post(
          'https://rextester.com/rundotnet/Run',
          params,
          { timeout: 20000 }
        );
        const result = r3.data;
        return res.json({
          stdout: result.Result || '',
          stderr: result.Errors || '',
          exitCode: result.Errors ? 1 : 0,
        });
      } catch (e3) {
        console.error('Rextester error:', e3.message);
        return res.status(500).json({
          stdout: '',
          stderr: '❌ Execution failed. Please try again in a moment.',
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