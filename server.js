var express = require('express');
var path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ✅ Use key.json as is
const serviceAccount = require(path.join(__dirname, 'key.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

var app = express();
const saltRounds = 10;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Serve HTML files from their **current** location (not "public")
const HTML_DIR = __dirname; // Change this if your HTML files are in a subfolder

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Welcome to our site!</h1>');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(HTML_DIR, 'login.html'));
});

app.post('/login', async(req, res) => {
    const { Email, Password } = req.body;

    try {
        const usersRef = db.collection('userDemo');
        const snapshot = await usersRef.where('Email', '==', Email).get();

        if (snapshot.empty) {
            return res.send('Invalid email or password. <a href="/login">Try again</a>');
        }

        let userData;
        snapshot.forEach(doc => { userData = doc.data(); });

        const match = await bcrypt.compare(Password, userData.Password);
        if (!match) {
            return res.send('Invalid email or password. <a href="/login">Try again</a>');
        }

        res.sendFile(path.join(HTML_DIR, 'welcome.html'));
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send('Error during login. Please try again.');
    }
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(HTML_DIR, 'signup.html'));
});

app.post('/signupsubmit', async(req, res) => {
    const { FullName, Email, Password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        await db.collection('userDemo').add({
            FullName,
            Email,
            Password: hashedPassword,
            createdAt: new Date(),
        });

        res.send('Signup successful! <a href="/login">Login here</a>');
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send('Error during signup. Please try again.');
    }
});

app.listen(5049, () => {
    console.log('Server running on http://localhost:5049');
});