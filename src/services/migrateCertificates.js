// =====================================================
// ONE-TIME MIGRATION SCRIPT
// Run this ONCE from browser console or as a temporary
// admin page to migrate all existing certificates
// to the certificatesPublic top-level collection
// =====================================================

import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * Migrates ALL existing user certificates to certificatesPublic
 * so QR verification works without a collectionGroup index.
 * Safe to run multiple times — uses certificateId as doc ID (idempotent).
 */
export const migrateAllCertificatesToPublic = async (onProgress) => {
  const results = { migrated: 0, skipped: 0, failed: 0, errors: [] };

  try {
    onProgress?.('Fetching all users...');

    const usersSnap = await getDocs(collection(db, 'users'));
    const userIds = usersSnap.docs.map(d => d.id);
    onProgress?.(`Found ${userIds.length} users. Processing...`);

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      onProgress?.(`User ${i + 1}/${userIds.length}: ${userId}`);

      try {
        const certsSnap = await getDocs(
          collection(db, 'users', userId, 'certificates')
        );

        for (const certDoc of certsSnap.docs) {
          const certData = certDoc.data();
          const certId = certData.certificateId;

          if (!certId) {
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
          } catch (writeErr) {
            results.failed++;
            results.errors.push({ certId, userId, error: writeErr.message });
          }
        }
      } catch (userErr) {
        console.warn(`Could not read certs for user ${userId}:`, userErr.message);
      }
    }

    onProgress?.(`Done! Migrated: ${results.migrated}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
    return { success: true, results };

  } catch (error) {
    return { success: false, error: error.message, results };
  }
};