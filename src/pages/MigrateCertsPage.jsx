// @ts-nocheck
// TEMPORARY ADMIN PAGE — Delete after migration is done
// Add to App.js: {currentPage === 'migrate-certs' && <MigrateCertsPage />}
// Access at: faizupyzone.shop/#migrate-certs (login as admin first)

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

export default function MigrateCertsPage() {
  const { user } = useAuth();
  const [running, setRunning]   = useState(false);
  const [log, setLog]           = useState([]);
  const [done, setDone]         = useState(false);
  const [stats, setStats]       = useState(null);

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

    const results = { migrated: 0, skipped: 0, failed: 0 };

    try {
      addLog('Fetching all users...');
      const usersSnap = await getDocs(collection(db, 'users'));
      const userIds = usersSnap.docs.map(d => d.id);
      addLog(`Found ${userIds.length} users.`);

      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        addLog(`Processing user ${i + 1}/${userIds.length}...`);

        try {
          const certsSnap = await getDocs(collection(db, 'users', userId, 'certificates'));

          if (certsSnap.empty) continue;

          addLog(`  → ${certsSnap.docs.length} certificate(s) found`);

          for (const certDoc of certsSnap.docs) {
            const certData = certDoc.data();
            const certId = certData.certificateId;

            if (!certId) {
              addLog(`  ⚠️ Skipped — no certificateId field`);
              results.skipped++;
              continue;
            }

            try {
              await setDoc(doc(db, 'certificatesPublic', certId), {
                ...certData,
                userId,
                migratedAt: new Date().toISOString(),
                timestamp: certData.timestamp || Timestamp.now(),
              });
              addLog(`  ✅ Migrated: ${certId}`);
              results.migrated++;
            } catch (e) {
              addLog(`  ❌ Failed: ${certId} — ${e.message}`);
              results.failed++;
            }
          }
        } catch (e) {
          addLog(`  ⚠️ Could not read user ${userId}: ${e.message}`);
        }
      }

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog(`✅ Migrated: ${results.migrated}`);
      addLog(`⚠️ Skipped:  ${results.skipped}`);
      addLog(`❌ Failed:   ${results.failed}`);
      addLog('Migration complete!');
      setStats(results);
      setDone(true);

    } catch (err) {
      addLog(`❌ Fatal error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <h1 style={{ color: '#fbbf24', fontSize: 22, marginBottom: 8 }}>
          Certificate Migration Tool
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
          Copies ALL existing certificates from <code style={{ color: '#818cf8' }}>users/&#123;uid&#125;/certificates</code> to <code style={{ color: '#10b981' }}>certificatesPublic</code> so QR verification works.
          Safe to run multiple times.
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
            {running ? '⏳ Running migration...' : '🚀 Start Migration'}
          </button>
        )}

        {done && stats && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981',
          }}>
            <div style={{ color: '#10b981', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              Migration Complete!
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 13 }}>
              ✅ Migrated: <strong>{stats.migrated}</strong> &nbsp;|&nbsp;
              ⚠️ Skipped: <strong>{stats.skipped}</strong> &nbsp;|&nbsp;
              ❌ Failed: <strong>{stats.failed}</strong>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
              You can now delete this page from App.js and remove the route.
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#0a0a0a', border: '1px solid #1e293b',
            borderRadius: 10, padding: '16px',
            maxHeight: 420, overflowY: 'auto',
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