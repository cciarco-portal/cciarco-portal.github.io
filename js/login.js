<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCIARCO Portal</title>
    <link rel="icon" href="images/CCIARCO.ico" type="image/x-icon">
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
        import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyAkg7ZFnBfbU0LVxfiraknwpzVgAAOu-Lc",
            authDomain: "cciarco-portal.firebaseapp.com",
            projectId: "cciarco-portal",
            storageBucket: "cciarco-portal.firebasestorage.app",
            messagingSenderId: "513140257536",
            appId: "1:513140257536:web:e8b7a6cdd57284054ff9e5",
            measurementId: "G-0J0T2WDJJQ"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        const db = getFirestore(app);

        document.getElementById("google-login").addEventListener("click", async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const emailDomain = user.email.split("@")[1];
                
                if (emailDomain !== "tangentsolutionsin.com") {
                    alert("Only @tangentsolutionsin.com emails are allowed.");
                    await signOut(auth);
                    return;
                }
                
                const userRef = doc(db, "approvals", user.email);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists() && user.email !== "gad@tangentsolutionsinc.com") {
                    alert("Your account is pending approval.");
                    await signOut(auth);
                    return;
                }
                
                window.location.href = "html/home.html";
            } catch (error) {
                console.error("Error during Google Login:", error);
                alert("Login failed. Please try again.");
            }
        });
    </script>
    <style>
        body, html {
            height: 100%;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #141E30;
        }
        .login-container {
            background-color: #1A2C43;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .logo {
            width: 100px;
            margin-bottom: 20px;
        }
        h2 {
            color: #fff;
            margin-bottom: 30px;
        }
        .google-btn {
            background: #4285F4;
            color: white;
            border: none;
            padding: 12px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: 0.3s;
        }
        .google-btn:hover {
            background: #357AE8;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <img src="images/CCIARCO.png" class="logo" alt="CCIARCO Logo">
        <h2>Login with Google</h2>
        <button id="google-login" class="google-btn">Sign in with Google</button>
    </div>
</body>
</html>
