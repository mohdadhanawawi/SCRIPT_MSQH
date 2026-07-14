// GANTIKAN nilai di bawah dengan config projek Firebase anda sendiri.
// Dapatkan dari: Firebase Console → Project settings → General → "Your apps" → Web app → SDK setup and configuration.
// Nilai-nilai ini SELAMAT untuk didedahkan di sisi client (browser); akses sebenar dikawal oleh Firestore Security Rules
// (lihat fail firestore.rules), bukan oleh kerahsiaan config ini.

export const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID",
};
