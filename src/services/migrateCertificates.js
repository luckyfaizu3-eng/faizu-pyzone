// =====================================================
// SINGLE USER MIGRATION — ravikumarravi0220@gmail.com
// =====================================================

import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

export const migrateSingleUser = async (onProgress) => {
  const results = { migrated: 0, skipped: 0, failed: 0, errors: [] };

  const userId = 'gX25BN3UZOWzaOxRTkuHyruhSP12'; // ravikumarravi0220@gmail.com

  try {
    onProgress?.(`Checking user: ${userId}`);

    const certsSnap = await getDocs(
      collection(db, 'users', userId, 'certificates')
    );

    if (certsSnap.empty) {
      onProgress?.('No certificates found for this user.');
      return { success: true, results };
    }

    onProgress?.(`Found ${certsSnap.docs.length} certificate(s)`);

    for (const certDoc of certsSnap.docs) {
      const certData = certDoc.data();
      const certId = certData.certificateId;

      if (!certId) {
        onProgress?.(`Skipped — no certificateId found`);
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
        results.migrated++;
        onProgress?.(`✅ Migrated: ${certId}`);
      } catch (writeErr) {
        results.failed++;
        results.errors.push({ certId, userId, error: writeErr.message });
        onProgress?.(`❌ Failed: ${certId} — ${writeErr.message}`);
      }
    }

    onProgress?.(`Done! Migrated: ${results.migrated} | Skipped: ${results.skipped} | Failed: ${results.failed}`);
    return { success: true, results };

  } catch (error) {
    onProgress?.(`Error: ${error.message}`);
    return { success: false, error: error.message, results };
  }
};