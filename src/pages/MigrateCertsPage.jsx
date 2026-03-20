// @ts-nocheck
// TEMPORARY ADMIN PAGE — Delete after migration is done

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

const KNOWN_USER_IDS = [
  '0qVDmxAw0iVUkp9tpy2bdCbTAA23',
  '1IDk6aBGXvQxxK0RbBytCPD3gmt2',
  '2EfW6sHeEsbI3cBazxmVFf5Z8rw1',
  '30HV8Eu93kPYoZKgakGm5fLd9gq2',
  '3F6f97d3cwWDBwsSXI02Hh0qKbF2',
  '6Xe5iBheX0ZuxWCeZcEJC9mbnAx1',
  '8c3vjxIVszU7DyNQHqF8Mwl0XXA2',
  '9uGH0G9JD1Q90YTJRdnT1DaNSPd2',
  'AmvkhakMzERa7hKEX5dhTG1uqB63',
  'BuX9AivypHZHBKE3aB1IFXoA3AU2',
  'CT3zEm3T1QdmVxP3y3ttPBJ9zgo1',
  'Cgf4PhvlJEe2p20t6m9hcYLM1wh1',
  'EWzYYcIXQ4bSLdJhiTrIzDTAXtU2',
  'FF3wx56DbdOqRbn7SaBk3Uf92lg1',
  'H7wOM8iiT7aWs9pvYhKTVzqwmbM2',
  'ImtgWAHKrBN4QX9h3rZuONb29Cz2',
  'IoyYNgeb6HQ93PRxQNfNTX6IXVd2',
  'JJNfFkRdTDMVBTVeJhgeZxssZwa2',
  'JKFFrr1QCKVcSd10QCP7DYOfzjt2',
  'K52ukXMrdrgfyfAVg3FpHWJVZZu2',
  'L8lpMFRzZ3TRk65YgmoIajo7UNr2',
  'LPk6e3aERch8JK9vVbKGNfEbHBq1',
  'MMV5keBpswcfluYd5Wzonn04vSE3',
  'MTtd5XR4WuPUN5TSoqg0L1hx5ak2',
  'MsGK9X3ZrddOueRkvZ9W8bBvMS02',
  'QLr8HRy2z9XKK3IWqZd2JLQfpZI2',
  'R0FtBL0HofR3CNsbXsC6h5l2LN22',
  'RZ7IopRmVKfZx3dHZhwu4H20HSU2',
  'SpafvAdpeuOACcyZTHwoiGsMQBn1',
  'VfsDJSdsnbW02GF7iTpSMRSC3RB2',
  'VjjTeGgPqRRddVdh8QWMeUVoMof1',
  'WPROiXKLseOuYYHNX9Mp6ldqdhq2',
  'X4NETYCChvMTkx0GVD90ulH2m0H2',
  'Y7jODttwijNp2zJMdrr1vm5D7I82',
  'ZB6XK3LMugWmHHPOpJhclXcX0vv2',
  'aKciyxy56CPB0lwdjOy2KVHaGNF3',
  'bLzFRtvmndWFJOclB9swfBZDTlK2',
  'bq4nz9qgBZgBNDyXbBj6gMeTOhq2',
  'cuERoc5en8WXfZkbVTCv58Bo8wH2',
  'dzYmEoISviMTDXXh3ZUpwuiBgxg2',
  'g7YrmNpHDSaH6KOFVmsQPbWs58M2',
  'gX25BN3UZ0WzaOxRTkuHyruhSP12',
  'icOsGhKBsHcSrOioOaZW6hE6itV2',
  'j1nOyYEKWiT1O9JzswDJdTqGpvg1',
  'mcSqAtjXM3NhLKpn7utmljXtHS32',
  'o6vyMkCRMTdrHaJSiqyl7RxAr7f1',
  'p1iO03Li60Pk6moTqkku41t3Jrg1',
  'qcPYilnsMRbZZ3OrdR7AELCghmw2',
  's4txtD7691WDee0djMX7PY8u8bO2',
  'scVSe1vN5MPTuHqaZddUu90PVA93',
  'uaUdTm3PyGWUqnJs3S3XaPDHKDb2',
  'uxJzBfwqvtZ8lpmnPrGPuRWIDg63',
  'xQtA0zHLuKXXxgdRs3ZkKCoQcKZ2',
  'zOfD27C7nqU4Z1ww68yVfW6fyUB2',
];

export default function MigrateCertsPage() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [log, setLog]         = useState([]);
  const [done, setDone]       = useState(false);
  const [stats, setStats]     = useState(null);

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

    const results = { migrated: 0, skipped: 0, failed: 0, usersProcessed: 0, certsFound: 0 };

    try {
      addLog(`Starting — ${KNOWN_USER_IDS.length} users to check...`);

      for (let i = 0; i < KNOWN_USER_IDS.length; i++) {
        const userId = KNOWN_USER_IDS[i];
        results.usersProcessed++;

        try {
          const certsSnap = await getDocs(
            collection(db, 'users', userId, 'certificates')
          );

          if (certsSnap.empty) {
            addLog(`[${i+1}/${KNOWN_USER_IDS.length}] ${userId.slice(0,14)}... — no certs`);
            continue;
          }

          addLog(`[${i+1}/${KNOWN_USER_IDS.length}] ${userId.slice(0,14)}... — 🔍 ${certsSnap.docs.length} cert(s)!`);
          results.certsFound += certsSnap.docs.length;

          for (const certDoc of certsSnap.docs) {
            const certData = certDoc.data();
            const certId   = certData.certificateId;

            if (!certId) {
              addLog(`  ⚠️ Skipped — no certificateId (docId: ${certDoc.id})`);
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
          addLog(`  ⚠️ Error: ${e.message}`);
        }
      }

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog(`👥 Users checked: ${results.usersProcessed}`);
      addLog(`🔍 Certs found: ${results.certsFound}`);
      addLog(`✅ Migrated: ${results.migrated}`);
      addLog(`⚠️ Skipped: ${results.skipped}`);
      addLog(`❌ Failed: ${results.failed}`);
      addLog('Done!');
      setStats(results);
      setDone(true);

    } catch (err) {
      addLog(`❌ Fatal: ${err.message}`);
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
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
          <code style={{ color: '#818cf8' }}>users/&#123;uid&#125;/certificates</code> → <code style={{ color: '#10b981' }}>certificatesPublic</code>
        </p>
        <p style={{ color: '#475569', fontSize: 12, marginBottom: 24 }}>
          {KNOWN_USER_IDS.length} users hardcoded • Safe to run multiple times
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
            {running ? `⏳ Running... (${log.length} steps)` : '🚀 Start Migration'}
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
              👥 Users checked: <strong>{stats.usersProcessed}</strong><br/>
              🔍 Certificates found: <strong>{stats.certsFound}</strong><br/>
              ✅ Migrated: <strong style={{ color: '#10b981' }}>{stats.migrated}</strong><br/>
              ⚠️ Skipped: <strong>{stats.skipped}</strong><br/>
              ❌ Failed: <strong style={{ color: stats.failed > 0 ? '#ef4444' : '#e2e8f0' }}>{stats.failed}</strong>
            </div>
            {stats.migrated > 0 && (
              <div style={{ color: '#34d399', fontSize: 12, marginTop: 10, padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: 6 }}>
                ✅ QR verification ab kaam karega! App.js se migration route hata sakte ho.
              </div>
            )}
            {stats.certsFound === 0 && (
              <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 10 }}>
                ⚠️ Koi certificates nahi mile — Firebase Console mein check karo ki subcollection "certificates" hai.
              </div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div style={{
            background: '#0a0a0a', border: '1px solid #1e293b',
            borderRadius: 10, padding: '16px',
            maxHeight: 500, overflowY: 'auto',
          }}>
            {log.map((line, i) => (
              <div key={i} style={{
                fontSize: 12, lineHeight: 1.8,
                color: line.includes('✅') ? '#10b981'
                  : line.includes('❌') ? '#ef4444'
                  : line.includes('⚠️') ? '#fbbf24'
                  : line.includes('━') ? '#475569'
                  : line.includes('cert(s)') ? '#818cf8'
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