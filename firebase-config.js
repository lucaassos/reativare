const firebaseConfig = {
  apiKey: "AIzaSyDOIv-6Bv-6XCNxL5A6JjVmSyVhmK8riu8",
  authDomain: "reativareapp.firebaseapp.com",
  projectId: "reativareapp",
  storageBucket: "reativareapp.firebasestorage.app",
  messagingSenderId: "510544843755",
  appId: "1:510544843755:web:cce16e5940d782135fbfae"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var db = firebase.firestore();
