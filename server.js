const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;
const Company = require('./mongo/company.js');
const Project = require('./mongo/project.js');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { AutoEncryptionLoggerLevel } = require('mongodb-legacy');
const cookieParser = require("cookie-parser");
const e = require('express');

//how many round should be used to generate the encrypted password
const saltRounds = 10;

//---------------------set up app---------------------
app.use(express.json({ limit: '16mb' }));
app.use(cors()); // Enable CORS
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // Enable cookie parsing
app.use(session({
    secret: process.env.secret,  // Change this to a strong, random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to `true` if using HTTPS
}));


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
    //console.log("session " + [req.session.Info]);
    const users = req.session.Info ? [req.session.Info] : [];
    res.render('user', { users: users });  // Changed from 'view' to 'user'
});


app.get('/create', (req, res) => {
    res.render('create');  // Changed from 'view' to 'create'
});  // Add your create route here

app.get('/login', (req, res) => {
    res.render('login');  // Changed from 'view' to 'login'
});  // Add your login route here

app.get('/home', authenticateToken, (req, res) => {
    //console.log(req.user.role);
    let code;// = process.env.MEM_ROLE
    if (req.user.role === "supervisor") {
        code = process.env.SUB_ROLE
    } else if (req.user.role === "member") {
        code = process.env.MEM_ROLE
    }
    res.render('home', { Code: code });  // Changed from 'view' to 'home'
});

app.get('/chats', authenticateToken, (req, res) => {
    res.render('chat');  // Changed from 'view' to 'chats'
});

app.get('/projects', authenticateToken, (req, res) => {
    res.render('project');  // Changed from 'view' to 'projects'
});


app.get('/Members', authenticateToken, async (req, res) => {
    if (req.user.role === "supervisor") {
        //console.log(req.user);
        const company = await Company.find({ "members.level": "Member", email: req.user.Company_email });
        const members = company.map(c => c.members).flat();
        //console.log(members);
        res.render('Members', { members: members });
    }
    else {
        res.redirect("/");
    }
});

app.get('/invite', authenticateToken, (req, res) => {
    if (req.user.role === "supervisor") {
        res.render('invite');
    }
    else {
        res.redirect("/");
    }
});

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

// Default Black Profile Image (Use a hosted image or a Base64 string)
const DEFAULT_PROFILE_IMAGE = "https://avatar.iran.liara.run/public/boy?username=Ash"; //  Placeholder


app.post('/add-company', async (req, res) => {
    try {
        //get company, supervisors, and members from the body
        const { company, supervisors, members } = req.body;

        //make sure that the company, supervisors, and members emails are not already in the database
        const companyExists = await Company.findOne({ email: company.email });
        if (companyExists) { return res.status(201).send({ message: 'Company already exists' }); }
        const supervisorExists = await Company.findOne({ "supervisors.email": supervisors[0].email });
        if (supervisorExists) { return res.status(201).send({ message: 'Supervisor already exists' }); }
        const memberExists = await Company.findOne({ "members.email": members[0].email });
        if (memberExists) { return res.status(201).send({ message: 'Member already exists' }); }

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

        // Assuming encryptedSupervisors and encryptedMembers are arrays of objects
        const updatedSupervisors = encryptedSupervisors.map(supervisor => ({
            ...supervisor,
            profile: DEFAULT_PROFILE_IMAGE
        }));

        const updatedMembers = encryptedMembers.map(member => ({
            ...member,
            profile: DEFAULT_PROFILE_IMAGE
        }));

        // Create a new company instance
        const newCompany = new Company({
            name: company.name,
            address: company.address,
            email: company.email,
            industry: company.industry,
            supervisors: updatedSupervisors,
            members: updatedMembers,
        });

        await newCompany.save();

        //console.log(newCompany.supervisors?.[0]?._id)
        //res.status(201).send({ message: 'Company data added successfully', newCompany });
        // Generate JWT Token
        const token = jwt.sign(
            { id: newCompany.supervisors?.[0]?._id, role: "supervisor", Company_email: newCompany.email },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "1h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(token);

        //test to see if token is working
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000 // 1 hour expiration
        });
        //console.log("home");
        res.json({ message: "Login Successful" });
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
        if (!company) return res.status(400).send('<script>alert("Company Not Found");window.location.href = "/login"; // Redirect back to login page</script>');

        // Find supervisor in company
        const supervisor = company.supervisors.find(sup => sup.email === email);
        if (!supervisor) return res.status(400).send('<script>alert("Supervisor Not Found");window.location.href = "/login"; // Redirect back to login page</script>');

        // Check password
        const isMatch = await bcrypt.compare(password, supervisor.password);
        if (!isMatch) return res.status(400).send('<script>alert("invalid credentials");window.location.href = "/login"; // Redirect back to login page</script>');

        // Generate JWT Token
        const token = jwt.sign(
            { id: supervisor._id, role: "supervisor" },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "1h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(token);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000 // 1 hour expiration
        });
        res.redirect(`/home`);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/MLogin", async (req, res) => {
    try {
        const { email, password, companyEmail } = req.body;

        //see if body is being passed
        //console.log(req.body);
        // Find company
        //console.log(companyEmail);
        const Mcompany = await Company.findOne({ email: companyEmail });
        if (!Mcompany) return res.status(400).send('<script>alert("Company Not Found");window.location.href = "/login"; // Redirect back to login page</script>');

        // Find supervisor in company
        const member = Mcompany.members.find(mem => mem.email === email);
        if (!member) return res.status(400).send('<script>alert("Member Not Found");window.location.href = "/login"; // Redirect back to login page</script>');

        // Check password
        const isMatch = await bcrypt.compare(password, member.password);
        if (!isMatch) return res.status(400).send('<script>alert("Invalid credentials");window.location.href = "/login"; // Redirect back to login page</script>');

        //console.log(Mcompany.members + member + isMatch);

        // Generate JWT Token
        const Mtoken = jwt.sign(
            { id: member._id, role: "member" },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "1h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(Mtoken);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.cookie("token", Mtoken, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 1000 // 1 hour expiration
        });
        res.redirect(`/home`);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


app.post('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

app.post('/users', async (req, res) => {
    try {
        const UToken = req.cookies?.token;
        if (!UToken) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        //console.log(UToken);

        let user = null;
        jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            //console.log("ran1");
            user = u;
        });
        //console.log(user);
        const USuper = await Company.findOne({ "supervisors._id": user.id })
        const Umem = await Company.findOne({ "members._id": user.id });


        let sup;
        if (USuper == null) {
            //console.log("ran");
            sup = Umem.members.length;
        } else {
            sup = USuper.supervisors.length;
        }


        for (let i = 0; i < sup; i++) {
            if (Umem.members[i]._id == user.id) {
                //console.log("ran");
                let UM = Umem.members.find(sup => sup._id.toString() === user.id);
                //console.log(UM);
                req.session.Info = UM;
                return res.json({ member: UM });
            } else if (USuper.supervisors[i]._id == user.id) {
                let US = USuper.supervisors.find(sup => sup._id.toString() === user.id);
                req.session.Info = US;
                return res.json({ supervisor: US });
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/change-password/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;
        //console.log("password " + password + " userId " + userId);

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const updatedUser = await Company.findOneAndUpdate(
            { "supervisors._id": userId },
            { $set: { "supervisors.$.password": hashedPassword } },
            { new: true, runValidators: true }
        ) || await Company.findOneAndUpdate(
            { "members._id": userId }, // If not found, search in members
            { $set: { "members.$.password": hashedPassword } },
            { new: true, runValidators: true }
        );
        //testing to see first what the updatesUser was getting and also to see if the user was found
        //const u = await Company.findOne({ "supervisors._id": userId });
        //console.log("updatedUser " + updatedUser);
        //console.log("u " + u);

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Password updated successfully", updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Upload Profile Image in Base64
app.post("/upload-profile", async (req, res) => {
    try {
        const { userId, profileImage } = req.body;
        //console.log("userId " + userId + " profileImage " + profileImage);

        if (!profileImage) {
            return res.status(400).json({ success: false, message: "No image provided" });
        }

        // Update user's profile image
        const user = await Company.findOneAndUpdate(
            { "supervisors._id": userId }, // Search in supervisors first
            { $set: { "supervisors.$.profile": profileImage } },
            { new: true, runValidators: true }
        ) || await Company.findOneAndUpdate(
            { "members._id": userId }, // If not found, search in members
            { $set: { "members.$.profile": profileImage } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            message: "Profile image updated successfully",
            profileImage
        });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ success: false, message: "Error uploading image", error });
    }
});









// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
