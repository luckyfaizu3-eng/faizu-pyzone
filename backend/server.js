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

// Check if python3 is available on this system
const PYTHON = (() => {
  try { execSync('python3 --version'); return 'python3'; } catch {}
  try { execSync('python --version'); return 'python'; }  catch {}
  return null;
})();

console.log('Python binary:', PYTHON || 'NOT FOUND');

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🐍 FaizUpyZone Python Compiler!',
    python: PYTHON || 'not available'
  });
});

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
  console.log('\n🐍 Python Backend on http://localhost:' + PORT);
  console.log('   Python binary: ' + (PYTHON || 'NOT FOUND'));
  console.log('   Press Ctrl+C to stop\n');
});