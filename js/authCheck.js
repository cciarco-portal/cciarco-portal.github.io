<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "cciarco-portal.firebaseapp.com",
        projectId: "cciarco-portal",
        storageBucket: "cciarco-portal.firebasestorage.app",
        messagingSenderId: "513140257536",
        appId: "1:513140257536:web:e8b7a6cdd57284054ff9e5",
        measurementId: "G-0J0T2WDJJQ"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Debugging: Check authentication state
    onAuthStateChanged(auth, (user) => {
        console.log("Auth state on restricted page:", user);
        if (!user) {
            alert("You must log in first!");
            window.location.href = "../index.html";
        }
    });
</script>
