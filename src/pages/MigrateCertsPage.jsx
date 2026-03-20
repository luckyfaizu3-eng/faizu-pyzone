// @ts-nocheck
// SINGLE USER MIGRATION — ravikumarravi0220@gmail.com (GfnPQ8tGyrSgAbeaJkHbUDXUdpS2)
// Run this once, then delete this file.

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';
const TARGET_USER_ID = 'GfnPQ8tGyrSgAbeaJkHbUDXUdpS2';
const TARGET_EMAIL = 'ravikumarravi0220@gmail.com';

export default function MigrateSingleUserPage() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState(null);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: 700 }}>Admin only page.</p>
      </div>
    );
  }

  const addLog = (msg) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runMigration = async () => {
    setRunning(true);
    setLog([]);
    setDone(false);
    setStats(null);

    const results = { migrated: 0, skipped: 0, failed: 0, certsFound: 0 };

    try {
      addLog(`Checking user: ${TARGET_EMAIL}`);
      addLog(`User ID: ${TARGET_USER_ID}`);

      const certsSnap = await getDocs(
        collection(db, 'users', TARGET_USER_ID, 'certificates')
      );

      if (certsSnap.empty) {
        addLog('No certificates found for this user.');
        setStats(results);
        setDone(true);
        setRunning(false);
        return;
      }

      results.certsFound = certsSnap.docs.length;
      addLog(`Found ${certsSnap.docs.length} certificate(s)`);

      for (const certDoc of certsSnap.docs) {
        const certData = certDoc.data();
        const certId = certData.certificateId;

        if (!certId) {
          addLog(`Skipped — no certificateId (docId: ${certDoc.id})`);
          results.skipped++;
          continue;
        }

        try {
          await setDoc(doc(db, 'certificatesPublic', certId), {
            ...certData,
            userId: TARGET_USER_ID,
            migratedAt: new Date().toISOString(),
            timestamp: certData.timestamp || Timestamp.now(),
          });
          addLog(`✅ Migrated: ${certId}`);
          results.migrated++;
        } catch (e) {
          addLog(`❌ Failed: ${certId} — ${e.message}`);
          results.failed++;
        }
      }

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog(`Certs found: ${results.certsFound}`);
      addLog(`✅ Migrated: ${results.migrated}`);
      addLog(`⚠️ Skipped: ${results.skipped}`);
      addLog(`❌ Failed: ${results.failed}`);
      addLog('Done!');
      setStats(results);
      setDone(true);

    } catch (err) {
      addLog(`Fatal error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <h1 style={{ color: '#fbbf24', fontSize: 22, marginBottom: 8 }}>
          Single User Certificate Migration
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
          User: <code style={{ color: '#10b981' }}>{TARGET_EMAIL}</code>
        </p>
        <p style={{ color: '#475569', fontSize: 12, marginBottom: 24 }}>
          Migrates from <code style={{ color: '#818cf8' }}>users/{TARGET_USER_ID}/certificates</code> → <code style={{ color: '#10b981' }}>certificatesPublic</code>
        </p>

        {!done && (
          <button
            onClick={runMigration}
            disabled={running}
            style={{
              padding: '12px 32px',
              background: running ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10,
              color: running ? '#64748b' : '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer',
              marginBottom: 24,
            }}>
            {running ? '⏳ Running...' : '🚀 Start Migration'}
          </button>
        )}

        {done && stats && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 20,
            background: stats.migrated > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
            border: `2px solid ${stats.migrated > 0 ? '#10b981' : '#fbbf24'}`,
          }}>
            <div style={{ color: stats.migrated > 0 ? '#10b981' : '#fbbf24', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {stats.migrated > 0 ? '🎉 Migration Complete!' : '⚠️ Done — Check Log'}
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 2 }}>
              Certificates found: <strong>{stats.certsFound}</strong><br />
              ✅ Migrated: <strong style={{ color: '#10b981' }}>{stats.migrated}</strong><br />
              ⚠️ Skipped: <strong>{stats.skipped}</strong><br />
              ❌ Failed: <strong style={{ color: stats.failed > 0 ? '#ef4444' : '#e2e8f0' }}>{stats.failed}</strong>
            </div>
            {stats.migrated > 0 && (
              <div style={{ color: '#34d399', fontSize: 12, marginTop: 10, padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: 6 }}>
                ✅ QR verification will now work for this user. You can delete this page.
              </div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#0a0a0a', border: '1px solid #1e293b',
            borderRadius: 10, padding: '16px',
            maxHeight: 400, overflowY: 'auto',
          }}>
            {log.map((line, i) => (
              <div key={i} style={{
                fontSize: 12, lineHeight: 1.8,
                color: line.includes('✅') ? '#10b981'
                  : line.includes('❌') ? '#ef4444'
                  : line.includes('⚠️') ? '#fbbf24'
                  : line.includes('━') ? '#475569'
                  : '#94a3b8',
              }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}