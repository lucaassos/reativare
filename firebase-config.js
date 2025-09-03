// ATENÇÃO: COLE AQUI A CONFIGURAÇÃO DO SEU PROJETO FIREBASE
// Você encontra isso no Console do Firebase > Configurações do Projeto > Geral > Seus apps
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SUA_APP_ID"
};

// Inicializar o Firebase
firebase.initializeApp(firebaseConfig);

// Disponibilizar os serviços do Firebase para os outros scripts
const auth = firebase.auth();
const db = firebase.firestore();
