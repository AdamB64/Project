const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const Company = require('./mongo/company.js');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { AutoEncryptionLoggerLevel } = require('mongodb-legacy');
const cookieParser = require("cookie-parser");

//how many round should be used to generate the encrypted password
const saltRounds = 10;

//---------------------set up app---------------------
app.use(express.json());
app.use(cors()); // Enable CORS
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // Enable cookie parsing

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));  // Make sure this matches your actual directory name

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'CSS')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));


//---------------------GET routes---------------------
// Routes
app.get('/', (req, res) => {
    res.render('start');  // start page
});

app.get('/about', (req, res) => {
    res.render('about');  // Changed from 'view' to 'about'
});  // Add your about route here

app.get('/settings', (req, res) => {
    res.render('settings');  // Changed from 'view' to 'settings'
});  // Add your settings route here

app.get('/user', authenticateToken, (req, res) => {
    res.render('user');  // Changed from 'view' to 'user'
});  // Add your user route here


app.get('/create', (req, res) => {
    res.render('create');  // Changed from 'view' to 'create'
});  // Add your create route here

app.get('/login', (req, res) => {
    res.render('login');  // Changed from 'view' to 'login'
});  // Add your login route here

app.get('/home', authenticateToken, (req, res) => {
    res.render('home');  // Changed from 'view' to 'home'
});  // Add your home route here

//middleware function to check token of users
// Middleware to protect routes
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Get token from cookies
    //console.log(token);

    if (!token) {
        return res.redirect("/login"); // Redirect if no token is found
    }

    try {
        // Verify token
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to the request object (optional)
        req.user = user;

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.redirect("/login"); // Redirect on token failure
    }
}

//---------------------POST routes---------------------
// Add your routes here
app.post('/add-company', async (req, res) => {
    try {
        const { company, supervisors, members } = req.body;

        // Encrypt passwords for supervisors
        const encryptedSupervisors = await Promise.all(supervisors.map(async (supervisor) => {
            if (supervisor.password) {
                const hashedPassword = await bcrypt.hash(supervisor.password, saltRounds);
                return { ...supervisor, password: hashedPassword };
            }
            return supervisor;
        }));

        // Encrypt passwords for members
        const encryptedMembers = await Promise.all(members.map(async (member) => {
            if (member.password) {
                const hashedPassword = await bcrypt.hash(member.password, saltRounds);
                return { ...member, password: hashedPassword };
            }
            return member;
        }));

        // Create a new company instance
        const newCompany = new Company({
            name: company.name,
            address: company.address,
            email: company.email,
            industry: company.industry,
            supervisors: encryptedSupervisors,
            members: encryptedMembers,
        });

        await newCompany.save();

        console.log("1" + newCompany.supervisor)
        console.log("2" + newCompany.supervisor?.[0]?._id)
        console.log("3" + newCompany.supervisor[0][0]._id)
        //res.status(201).send({ message: 'Company data added successfully', newCompany });
        // Generate JWT Token
        const token = jwt.sign(
            { id: newCompany.supervisor?.[0]?._id, role: "supervisor" },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "1h" }                          // Expiration Time
        );
        //comfirm token
        console.log(token);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000 // 1 hour expiration
        });
        res.redirect('/home');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
    }
});


app.post("/SLogin", async (req, res) => {
    try {
        const { email, password, companyEmail } = req.body;

        //see if body is being passed
        //console.log(req.body);
        // Find company
        //console.log(companyEmail);
        const company = await Company.findOne({ email: companyEmail });
        if (!company) return res.status(400).json({ message: "Company not found" });

        // Find supervisor in company
        const supervisor = company.supervisors.find(sup => sup.email === email);
        if (!supervisor) return res.status(400).json({ message: "Supervisor not found" });

        // Check password
        const isMatch = await bcrypt.compare(password, supervisor.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Generate JWT Token
        const token = jwt.sign(
            { id: supervisor._id, role: "supervisor" },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "1h" }                          // Expiration Time
        );
        //comfirm token
        console.log(token);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000 // 1 hour expiration
        });
        res.redirect('/home');
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
