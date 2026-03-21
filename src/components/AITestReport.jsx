// @ts-nocheck
/**
 * FILE LOCATION: src/components/AITestReport.jsx
 *
 * EXPORTS:
 *   generateAIReport(testData)     — async fn, MockTestPage se call karo
 *   default DownloadAIReportButton — Results card mein use karo
 */

import React, { useState } from 'react';
import { Brain } from 'lucide-react';

const AI_API_URL = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';
const AI_MODEL   = 'claude-sonnet-4-20250514';

// ── jsPDF CDN loader ──────────────────────────────────────────
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement('script');
    s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload  = () => (window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF not found')));
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── AI Summary ────────────────────────────────────────────────
async function fetchAISummary(testData) {
  const score  = testData.score || testData.percentage || 0;
  const level  = (testData.level || 'basic').toUpperCase();
  const name   = testData.studentInfo?.fullName || testData.studentInfo?.name || 'Student';
  const time   = testData.timeTaken || 'N/A';
  const cor    = testData.correct || 0;
  const wrg    = testData.wrong   || 0;
  const tot    = testData.total   || 0;

  const hasCert    = score >= 55;
  const passedTest = score >= 40;

  const levelTopics = {
    BASIC:    'variables, data types, operators, if-else, loops, functions, lists, dictionaries, strings, basic OOP',
    ADVANCED: 'decorators, generators, context managers, advanced OOP, modules, file handling, exceptions, comprehensions',
    PRO:      'metaclasses, async/await, concurrency, performance optimization, design patterns, testing, packaging',
  };

  const scoreContext = hasCert
    ? `PASSED with Certificate (${score}% — earned certificate)`
    : passedTest
    ? `PASSED test (${score}% — but needs 55% for certificate)`
    : `DID NOT PASS (${score}% — needs 40% to pass, 55% for certificate)`;

  const prompt = `You are a senior Python coach at Pyskill (India's top Python mock test platform). Write a warm, professional AI performance report for this student.

Student Name: ${name}
Test Level: Python ${level}
Score: ${score}% | Correct: ${cor} | Wrong: ${wrg} | Total: ${tot} questions
Time Taken: ${time}
Result: ${scoreContext}
Certificate Earned: ${hasCert ? 'YES - Certificate issued!' : 'NO - Score below 55%'}

Scoring system at Pyskill:
- 55% and above = PASS + Certificate awarded
- 40% to 54% = PASS (test passed) but NO Certificate (need 55% for cert)
- Below 40% = NOT PASSED

Write with EXACTLY these 5 section headings (plain text only, no ** or ## symbols):

OVERALL PERFORMANCE
Write 2-3 sentences about their score. Mention specifically if they earned a certificate or not. Be honest but kind.

STRENGTHS IDENTIFIED
Write 3-4 bullet points (start each with -) about Python concepts they likely know well for ${level} level. Topics: ${levelTopics[level] || levelTopics.BASIC}

AREAS NEEDING IMPROVEMENT
Write 3-5 bullet points (start each with -) about specific Python topics to focus on. Be specific and helpful.

STUDY RECOMMENDATIONS
Write 4-5 bullet points (start each with -) with actionable study tips and time estimates.

MOTIVATIONAL MESSAGE
${hasCert
  ? 'Write 2-3 warm celebratory sentences. Congratulate them on earning the certificate. Encourage them to keep growing.'
  : passedTest
  ? 'Write 2-3 encouraging sentences. They passed the test but missed the certificate by a small margin. Motivate them to retake and aim for 55%.'
  : 'Write 2-3 deeply motivating sentences. They did not pass this time. Encourage them strongly — every expert was once a beginner. Tell them to keep practicing and retake.'}

Rules: Plain text only. No markdown. No question numbers. Total 280-340 words.`;

  const res = await fetch(AI_API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:      AI_MODEL,
      max_tokens: 1100,
      stream:     false,
      messages:   [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);

  const rawText = await res.text();
  let text = '';

  try {
    const data = JSON.parse(rawText);
    text = data.content?.[0]?.text
        || data.choices?.[0]?.message?.content
        || data.choices?.[0]?.delta?.content
        || '';
  } catch (_) {
    const lines = rawText.split('\n');
    const parts = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (jsonStr === '[DONE]' || !jsonStr) continue;
      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk.delta?.text
          || chunk.choices?.[0]?.delta?.content
          || chunk.content?.[0]?.text
          || '';
        if (delta) parts.push(delta);
      } catch (_) { /* skip bad chunk */ }
    }
    text = parts.join('');
  }

  if (!text || text.length < 80) throw new Error('Empty AI response');
  return text.trim();
}

// ── Parse AI text into 5 sections ────────────────────────────
function parseSections(aiText) {
  const titles = [
    'OVERALL PERFORMANCE',
    'STRENGTHS IDENTIFIED',
    'AREAS NEEDING IMPROVEMENT',
    'STUDY RECOMMENDATIONS',
    'MOTIVATIONAL MESSAGE',
  ];
  const upper  = aiText.toUpperCase();
  const result = [];
  for (let i = 0; i < titles.length; i++) {
    const start = upper.indexOf(titles[i]);
    if (start === -1) { result.push({ title: titles[i], body: '' }); continue; }
    const bodyStart = start + titles[i].length;
    const nextIdx   = i < titles.length - 1 ? upper.indexOf(titles[i + 1], bodyStart) : -1;
    const body      = aiText.slice(bodyStart, nextIdx === -1 ? undefined : nextIdx).trim();
    result.push({ title: titles[i], body });
  }
  return result;
}

// ── Pyskill SVG Logo → PNG → jsPDF addImage ──────────────────
async function drawPyskillLogo(doc, x, y, w, h) {
  try {
    const svgStr = `<svg width="512" height="512" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0A1628"/>
          <stop offset="100%" stop-color="#0D2550"/>
        </linearGradient>
        <linearGradient id="gc2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00D4FF"/>
          <stop offset="100%" stop-color="#0066FF"/>
        </linearGradient>
        <linearGradient id="ga2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00FFCC"/>
          <stop offset="100%" stop-color="#00AAFF"/>
        </linearGradient>
        <linearGradient id="gt2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00D4FF"/>
          <stop offset="100%" stop-color="#0055FF"/>
        </linearGradient>
      </defs>
      <circle cx="250" cy="250" r="240" fill="url(#bg2)"/>
      <circle cx="250" cy="250" r="238" fill="none" stroke="#00D4FF" stroke-width="2" opacity="0.4"/>
      <path d="M175,145 C155,145 148,155 148,168 L148,188 C148,200 138,208 125,210 C138,212 148,220 148,232 L148,252 C148,265 155,275 175,275" fill="none" stroke="url(#gc2)" stroke-width="12" stroke-linecap="round"/>
      <path d="M325,145 C345,145 352,155 352,168 L352,188 C352,200 362,208 375,210 C362,212 352,220 352,232 L352,252 C352,265 345,275 325,275" fill="none" stroke="url(#gc2)" stroke-width="12" stroke-linecap="round"/>
      <text x="250" y="222" font-family="Courier New,monospace" font-weight="900" font-size="72" fill="url(#ga2)" text-anchor="middle" dominant-baseline="central">Py</text>
      <circle cx="250" cy="268" r="5" fill="#00FFCC" opacity="0.8"/>
      <line x1="110" y1="305" x2="390" y2="305" stroke="#00D4FF" stroke-width="1" opacity="0.25"/>
      <text x="250" y="348" font-family="Arial,sans-serif" font-weight="800" font-size="54" fill="url(#gt2)" text-anchor="middle" dominant-baseline="central" letter-spacing="6">PYSKILL</text>
      <text x="250" y="390" font-family="Arial,sans-serif" font-weight="400" font-size="16" fill="#00AAFF" text-anchor="middle" dominant-baseline="central" letter-spacing="3" opacity="0.7">LEARN . CODE . GROW</text>
    </svg>`;
    const blob   = new Blob([svgStr], { type: 'image/svg+xml' });
    const url    = URL.createObjectURL(blob);
    const img    = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas    = document.createElement('canvas');
    canvas.width    = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 256, 256);
    URL.revokeObjectURL(url);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
  } catch (_) {
    doc.setFillColor(10, 22, 40);
    doc.circle(x + w / 2, y + h / 2, w / 2, 'F');
  }
}

// ── PDF Builder ───────────────────────────────────────────────
async function buildPDF(testData, aiText) {
  const JsPDF = await loadJsPDF();
  const doc   = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297, M = 15, CW = W - M * 2;

  const score     = testData.score || testData.percentage || 0;
  const name      = testData.studentInfo?.fullName || testData.studentInfo?.name || 'Student';
  const email     = testData.studentInfo?.email    || testData.userEmail          || '';
  const age       = testData.studentInfo?.age      || '';
  const addr      = testData.studentInfo?.address  || '';
  const level     = (testData.level || 'basic').toUpperCase();
  const date      = testData.testDate  || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const time      = testData.testTime  || '';
  const cor       = testData.correct   || 0;
  const wrg       = testData.wrong     || 0;
  const tot       = testData.total     || 0;
  const dur       = testData.timeTaken || 'N/A';

  const hasCert    = score >= 55;
  const passedTest = score >= 40;

  const C = {
    indigo:   [99,  102, 241],
    violet:   [139, 92,  246],
    indigoDk: [67,  56,  202],
    indigoL:  [199, 210, 254],
    green:    [16,  185, 129],
    red:      [239, 68,  68],
    amber:    [245, 158, 11],
    slate:    [15,  23,  42],
    slateM:   [51,  65,  85],
    gray:     [100, 116, 139],
    grayL:    [148, 163, 184],
    light:    [248, 250, 252],
    white:    [255, 255, 255],
    border:   [226, 232, 240],
  };

  const resultClr = hasCert ? C.green : passedTest ? C.amber : C.red;

  const drawWatermark = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(44);
    doc.setTextColor(220, 222, 250);
    const wPos = [
      [10, 55], [80, 30],  [148, 55],
      [10, 125],[80, 100], [148, 125],
      [10, 195],[80, 170], [148, 195],
      [10, 265],[80, 240], [148, 265],
    ];
    wPos.forEach(([x, y]) => doc.text('PYSKILL', x, y, { angle: 33 }));
    doc.setTextColor(...C.slate);
  };

  // PAGE 1
  drawWatermark();

  // ── HEADER BAND ───────────────────────────────────────────
  doc.setFillColor(...C.indigoDk);
  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(...C.indigo);
  doc.rect(0, 40, W, 18, 'F');
  doc.setFillColor(...C.violet);
  doc.rect(0, 55, W, 3, 'F');

  await drawPyskillLogo(doc, W - M - 17, 5, 17, 17);

  doc.setTextColor(...C.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PYSKILL', M, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.indigoL);
  doc.text('LEARN  •  CODE  •  GROW  |  faizupyzone.shop', M, 30);

  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.indigoL);
  doc.roundedRect(W - M - 52, 34, 52, 18, 3, 3, 'F');
  doc.setTextColor(...C.indigoDk);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('AI PERFORMANCE', W - M - 48, 42);
  doc.text('REPORT', W - M - 36, 49);

  const lvlColors = { BASIC: C.green, ADVANCED: C.indigo, PRO: C.amber };
  const lvlClr    = lvlColors[level] || C.indigo;
  doc.setFillColor(...lvlClr);
  doc.roundedRect(M, 34, 28, 14, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const lvlW = doc.getTextWidth(level);
  doc.text(level, M + 14 - lvlW / 2, 43);

  // ── STUDENT INFO CARD ─────────────────────────────────────
  let y = 66;
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, y, CW, 44, 4, 4, 'FD');
  doc.setFillColor(...C.indigo);
  doc.roundedRect(M, y, 3, 44, 2, 2, 'F');

  doc.setTextColor(...C.slate);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(name, M + 8, y + 11);

  const details = [
    ['Email',    email   || '—'],
    ['Level',    `Python ${level} Mock Test`],
    ['Date',     date],
    ['Time',     time    || '—'],
    ['Duration', dur],
    ...(age  ? [['Age',     age]]  : []),
    ...(addr ? [['Location',addr]] : []),
  ];
  const colW = CW / 2 - 8;
  details.forEach(([lbl, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx  = M + 8 + col * (colW + 16);
    const dy  = y + 19 + row * 8;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.grayL);
    doc.text(lbl.toUpperCase() + ':', dx, dy);
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.slateM);
    const maxW      = colW - 2;
    const truncated = doc.getTextWidth(val) > maxW
      ? val.slice(0, Math.floor(val.length * maxW / doc.getTextWidth(val)) - 2) + '...'
      : val;
    doc.text(truncated, dx + 18, dy);
  });

  y += 50;

  // ── SCORE RESULT CARD ─────────────────────────────────────
  doc.setFillColor(...(hasCert ? [220,252,231] : passedTest ? [255,251,235] : [254,226,226]));
  doc.circle(M + 22, y + 22, 22, 'F');
  doc.setFillColor(...resultClr);
  doc.circle(M + 22, y + 22, 18, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  const scoreStr = `${score}%`;
  doc.text(scoreStr, M + 22 - doc.getTextWidth(scoreStr) / 2, y + 25);
  doc.setFontSize(5.5);
  const resultLabel = hasCert ? 'CERT EARNED' : passedTest ? 'PASSED' : 'NOT PASSED';
  doc.text(resultLabel, M + 22 - doc.getTextWidth(resultLabel) / 2, y + 33);

  const statsX   = M + 50;
  const statsArr = [
    ['Correct',  String(cor), C.green,  [240,253,244], [187,247,208]],
    ['Wrong',    String(wrg), C.red,    [254,242,242], [254,202,202]],
    ['Total Qs', String(tot), C.indigo, [238,242,255], [199,210,254]],
    ['Time',     dur,         C.amber,  [255,251,235], [253,230,138]],
  ];
  const boxW = (CW - 50) / 2 - 2;
  statsArr.forEach(([lbl, val, clr, bg, brd], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const sx  = statsX + col * (boxW + 4);
    const sy  = y + row * 23;
    doc.setFillColor(...bg);
    doc.setDrawColor(...brd);
    doc.setLineWidth(0.5);
    doc.roundedRect(sx, sy, boxW, 20, 3, 3, 'FD');
    doc.setTextColor(...clr);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const vw = doc.getTextWidth(val);
    doc.text(val, sx + boxW / 2 - vw / 2, sy + 10);
    doc.setTextColor(...C.gray);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    const lw = doc.getTextWidth(lbl.toUpperCase());
    doc.text(lbl.toUpperCase(), sx + boxW / 2 - lw / 2, sy + 16);
  });

  y += 52;

  // ── RESULT STATUS BANNER ─────────────────────────────────
  const bannerBg  = hasCert ? [240,253,244]  : passedTest ? [255,251,235]  : [254,242,242];
  const bannerBrd = hasCert ? [187,247,208]  : passedTest ? [253,230,138]  : [254,202,202];
  const bannerTxt = hasCert ? [...C.green]   : passedTest ? [...C.amber]   : [...C.red];
  doc.setFillColor(...bannerBg);
  doc.setDrawColor(...bannerBrd);
  doc.setLineWidth(0.8);
  doc.roundedRect(M, y, CW, 13, 2, 2, 'FD');
  doc.setTextColor(...bannerTxt);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const bannerMsg = hasCert
    ? `CERTIFICATE EARNED  —  Score: ${score}%  —  Python ${level} Level`
    : passedTest
    ? `TEST PASSED  —  Score: ${score}%  —  Need 55% for Certificate (${55 - score}% more needed)`
    : `NOT PASSED  —  Score: ${score}%  —  Need 40% to pass, 55% for Certificate`;
  const bw = doc.getTextWidth(bannerMsg);
  doc.text(bannerMsg, M + CW / 2 - bw / 2, y + 9);

  y += 18;

  // ── DIVIDER ───────────────────────────────────────────────
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 7;

  // ── AI REPORT HEADING ─────────────────────────────────────
  doc.setFillColor(...C.light);
  doc.setDrawColor(...C.border);
  doc.roundedRect(M, y, CW, 11, 2, 2, 'FD');
  doc.setTextColor(...C.indigo);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-POWERED PERFORMANCE ANALYSIS', M + 4, y + 7.5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PYSKILL AI', W - M - 22, y + 7.5);
  y += 16;

  // ── AI SECTIONS ───────────────────────────────────────────
  const sections  = parseSections(aiText);
  const secColors = [C.indigo, C.green, C.red, C.amber, C.violet];
  const secBgs    = [
    [238,242,255], [240,253,244], [254,242,242], [255,251,235], [245,243,255],
  ];
  const secBrds   = [
    [199,210,254], [187,247,208], [254,202,202], [253,230,138], [221,214,254],
  ];

  const addPageIfNeeded = (needed = 30) => {
    if (y + needed > H - 20) {
      doc.addPage();
      drawWatermark();
      y = 18;
    }
  };

  for (let i = 0; i < sections.length; i++) {
    const { title, body } = sections[i];
    if (!body) continue;
    addPageIfNeeded(35);

    const clr = secColors[i];
    const bg  = secBgs[i];
    const brd = secBrds[i];

    doc.setFillColor(...clr);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, M + 4, y + 7);
    y += 13;

    doc.setFontSize(8.8);
    doc.setFont('helvetica', 'normal');
    const allLines = doc.splitTextToSize(body, CW - 8);
    const lineH    = 5.2;
    const boxPadV  = 5;
    const boxH     = allLines.length * lineH + boxPadV * 2;

    addPageIfNeeded(boxH + 4);

    doc.setFillColor(...bg);
    doc.setDrawColor(...brd);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, boxH, 2, 2, 'FD');

    let ly = y + boxPadV + 4;
    allLines.forEach(line => {
      if (line.trim().startsWith('-')) {
        doc.setFillColor(...clr);
        doc.rect(M + 4, ly - 2.5, 2, 2, 'F');
        doc.setTextColor(...C.slateM);
        doc.text(line.replace(/^-\s*/, ''), M + 9, ly);
      } else {
        doc.setTextColor(...C.slateM);
        doc.text(line, M + 4, ly);
      }
      ly += lineH;
    });

    y += boxH + 6;
  }

  // ── FOOTER (all pages) ────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(...C.indigoDk);
    doc.rect(0, H - 14, W, 14, 'F');
    doc.setFillColor(...C.violet);
    doc.rect(0, H - 14, W, 2, 'F');

    await drawPyskillLogo(doc, M, H - 13, 10, 10);

    doc.setTextColor(...C.indigoL);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('PYSKILL  •  faizupyzone.shop  •  AI-Powered Performance Report', M + 13, H - 4.5);

    doc.setTextColor(...C.white);
    const pgStr = `${pg} / ${totalPages}`;
    const pgW   = doc.getTextWidth(pgStr);
    doc.text(pgStr, W - M - pgW, H - 4.5);

    doc.setFillColor(...C.violet);
    doc.roundedRect(W - M - pgW - 28, H - 12, 24, 7, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('AI VERIFIED', W - M - pgW - 26, H - 7);
  }

  return doc;
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT — generateAIReport(testData)
// ═══════════════════════════════════════════════════════════
export async function generateAIReport(testData) {
  try {
    const aiText = await fetchAISummary(testData);
    const doc    = await buildPDF(testData, aiText);
    const blob   = doc.output('blob');
    const url    = URL.createObjectURL(blob);
    const n      = (testData.studentInfo?.fullName || 'student')
                     .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const l      = (testData.level || 'basic').toLowerCase();
    return {
      success:  true,
      pdfUrl:   url,
      fileName: `Pyskill_AI_Report_${n}_${l}.pdf`,
    };
  } catch (err) {
    console.warn('[AITestReport] Silent fail:', err?.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════
// DEFAULT EXPORT — DownloadAIReportButton
// ═══════════════════════════════════════════════════════════
export default function DownloadAIReportButton({ isDark, savedReport }) {
  const [busy, setBusy] = useState(false);

  if (!savedReport?.pdfUrl) return null;

  const handleDownload = () => {
    setBusy(true);
    try {
      const a    = document.createElement('a');
      a.href     = savedReport.pdfUrl;
      a.download = savedReport.fileName || 'Pyskill_AI_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setBusy(false), 900);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={busy}
        style={{
          width:          '100%',
          padding:        '0.9rem',
          background:     busy
            ? (isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff')
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border:         'none',
          borderRadius:   '12px',
          color:          busy ? '#6366f1' : '#fff',
          fontSize:       '0.92rem',
          fontWeight:     '800',
          cursor:         busy ? 'not-allowed' : 'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '0.6rem',
          boxShadow:      busy ? 'none' : '0 4px 18px rgba(99,102,241,0.4)',
          transition:     'all 0.2s',
          marginBottom:   '0.6rem',
          letterSpacing:  '0.02em',
        }}
      >
        {busy ? (
          <>
            <span style={{ width: 16, height: 16, border: '2.5px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'aiSpinBtn 0.7s linear infinite' }} />
            Preparing Download...
          </>
        ) : (
          <>
            <Brain size={18} />
            Download AI Report PDF
          </>
        )}
      </button>
      <style>{`@keyframes aiSpinBtn { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}