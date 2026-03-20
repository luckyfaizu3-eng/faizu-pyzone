// =====================================================
// ONE-TIME MIGRATION SCRIPT — Updated with hardcoded user IDs
// =====================================================

import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

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

export const migrateAllCertificatesToPublic = async (onProgress) => {
  const results = { migrated: 0, skipped: 0, failed: 0, errors: [] };

  try {
    onProgress?.(`Starting — ${KNOWN_USER_IDS.length} users to check...`);

    for (let i = 0; i < KNOWN_USER_IDS.length; i++) {
      const userId = KNOWN_USER_IDS[i];
      onProgress?.(`User ${i + 1}/${KNOWN_USER_IDS.length}: ${userId.slice(0, 14)}...`);

      try {
        const certsSnap = await getDocs(
          collection(db, 'users', userId, 'certificates')
        );

        if (certsSnap.empty) continue;

        onProgress?.(`  → ${certsSnap.docs.length} cert(s) found!`);

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
            onProgress?.(`  ✅ Migrated: ${certId}`);
          } catch (writeErr) {
            results.failed++;
            results.errors.push({ certId, userId, error: writeErr.message });
            onProgress?.(`  ❌ Failed: ${certId}`);
          }
        }
      } catch (userErr) {
        onProgress?.(`  ⚠️ Error: ${userErr.message}`);
      }
    }

    onProgress?.(`Done! Migrated: ${results.migrated}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
    return { success: true, results };

  } catch (error) {
    return { success: false, error: error.message, results };
  }
};