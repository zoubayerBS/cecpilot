
import admin from 'firebase-admin';

// Intégration directe de la clé de service pour éviter les problèmes de chemin de fichier.
const serviceAccount = {
  "type": "service_account",
  "project_id": "cec-assistant",
  "private_key_id": "e4fbea4b8ca0c2b8b8bd813620bd4e18f4e9b370",
  // Remplacement de `\n` par `\\n` pour une interprétation correcte de la chaîne.
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnDqlij5JBXYLv\nuQGM8NzNvGmLInlF4aypeego1aS8f7k1be3oBqexLq1dgD2z4K73dDSE/MclrofA\nUs34j4u0zIKd2S7V+U9wqyy7C/0JGXUvO0MzkstJ/bdfmD4+PFWMiP0r0uXGVOOm\nuyUrM0tUtf2hvPXnmL51yuJXmj0db6nNUk9uAfggotmspaqPc9+eA+t7p4wYQYUt\nWv0XEnAsINQH6pLCAUodTML3tYoMicrcHsoPeoPraq2KtE5Y+HxeQY0zeMaaEKRY\n0bnGRM6lGV5RQqlcH7+IGQ3TJjiPKjrl2qK5tSTXt0H2EEGZPZ9DjG0HsqAgp1hT\n0U5ECBU9AgMBAAECggEAFQ/BpjXwnAIUnHGIMwM4601KRyrY/Ej38kP205Mf2k4G\nBSjvWhXgtXNrkwK0hMWaeYMyjeOqneMTpVkrM5+xXuF7xDfZ8ksky1EhahGYXLnT\nbtl7XviuXY05vbkde84ygO3ScWB87JTOQLqOdJRadnsdV3NR01mMBaDHCYFeHCRA\nF01WOVVOGEfau8IDkzZxn4dINW24qGPTX72/mDs929TkfpqOIYzpEFU8R4fUhVrY\n5BwnC3Nheou5ucchrrFQnzI8DfHmcKqsj0bcCNRTm0e8Hqjt+Rd55XdbR8iTVSuE\n3DqDsqmTXhRDAQgZwt0gFKAKQxdkZATRSI2maqk/twKBgQDb6AJbFP+AhNPhn1DC\nml6KyBtP62i+RM3OtpzKZNPuTk+39Vwx1hOQZXJ0xHPM8XvazaU3YXkVBXENYmwT\nArjlXVo9EwM5QNVKQ1ecFWvwWPqwhO8z6OdGw7ek0Ff7l9somC0vQ+fRiuQvrfXn\nI+a2I3PPMjNw7bjiEFvTX70l5wKBgQDCegzX/h56eNB4oSk9ftG7FN6nmA4oTzct\nt3qY8SU80VqOpijK2bWImh1tbFcZobpKX9X53dihW2VMw/pbOWcpTn2HLbypmnLC\nNHp2b9E/mObJu5/cEPlT+eV8D7bzV4w7UVZj2sSyEsnl07H6Efq4rNWWaM1q++34\n7KFOk2+/OwKBgQClEyiRjtWteAhFmf5Z1t+ZdlVqTOC305Za0iIonD+q6AZXpUur\n7XOKNV0R4la7RZsfyLd5NyZZbVhMH9HZA3YgV09iAV+uHsj9kke11y7LoT+uOlwF\nr5PNPyYgBnXFW10cv/9LN8JRPd3FHOU2uXB60Woh4yFSaGEc8gK8TWYDiQKBgQC7\nKj1sLpxkoBt6zRfkoEX29/nlb7jIYJypOfkacpK0+oNd4FpIB8jnQ/NoWSlmeLjS\nVXOYu0J+4HgYrlAnNZKsNWcoDwOQcx1Y/KqTi7/lpiEPK6yJXiinAk0y3ejkP3Ct\nsfUjuussulpm/xs9ocobq/MPg6OXAAkiVZJVDh4w+wKBgCwGzPZcsewZpnXw8+E5\n9sRK+n2sBPRKCd478i4h0yQKmEgfrIZa3NekWe8LRa8WvIUI2qY6lCjmhazrvI4s\nxcoEfcEt3+Po3sl21B/C6Fa7MUfPrs8JYZs7I6h5NDz5DXyBxgMBRFc7W7O7qxKD\nSA6wTLvUtc0VBRFGDq7tAVmv\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@cec-assistant.iam.gserviceaccount.com",
  "client_id": "103806915304442276605",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cec-assistant.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
export { db, admin };
