const express = require('express');
const session = require('express-session');
const mongoose = require('./mongo/mongo.js');
const path = require('path');
const app = express();
const PORT = 3000;
const Company = require('./mongo/company.js');
const Project = require('./mongo/project.js');
const Chat = require('./mongo/chats.js');
const Task = require('./mongo/task.js');
const GChat = require('./mongo/group_chats.js');
const { ObjectId, GridFSBucket } = require("mongodb");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const { AutoEncryptionLoggerLevel } = require('mongodb-legacy');
const cookieParser = require("cookie-parser");
const e = require('express');
const ejs = require('ejs');
const multer = require("multer");
const { get } = require('http');
const { profile } = require('console');

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

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads"); // GridFS Bucket Name
});

// GridFS Storage
//const storage = new multer.memoryStorage();
const storage = new GridFsStorage({
    url: process.env.MONGO_URL,
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: "uploads", // GridFS Collection
        };
    },
});
const upload = multer({ storage }).array("files", 5); // Accepts up to 5 files


// Serve static files
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));


//---------------------GET routes---------------------
// Routes
app.get('/', (req, res) => {
    res.render('start');  // start page
});

app.get('/about', (req, res) => {
    res.render('about');  // Changed from 'view' to 'about'
});  // Add your about route here

app.get('/user', authenticateToken, (req, res) => {
    //console.log("session " + [req.session.Info]);
    const users = req.session.Info ? [req.session.Info] : [];
    res.render('user', { users: users });  // Changed from 'view' to 'user'
});

app.get('/admin', authenticateToken, async (req, res) => {
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    const company = await Company.findOne({ email: user.Company_email });
    if (user.role === "supervisor") {
        //console.log(company.supervisors);
        res.render('admin', { supervisors: company.supervisors });
    } else {
        const referer = req.get('Referer') || "/home";
        res.redirect(referer);
    }

});

app.get('/task/:id', authenticateToken, async (req, res) => {
    const task = await Task.findById(req.params.id);
    //console.log(task);
    res.render('task', { task });
});

app.get('/profile/:id', authenticateToken, async (req, res) => {
    //console.log(req.params.id);
    const company = await Company.findOne({ "members._id": req.params.id }) || await Company.findOne({ "supervisors._id": req.params.id });
    const worker = company.supervisors.find(sup => sup._id.toString() === req.params.id) || company.members.find(mem => mem._id.toString() === req.params.id);
    //console.log(worker);
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    if (user.id === req.params.id) {
        //console.log("user");
        res.redirect('/user');
    } else {
        res.render('profile', { worker });
    }
})

app.get('/projects', authenticateToken, async (req, res) => {
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    //console.log(user.email);
    const project = await Project.find({ "members.email": user.email });
    //console.log(project);
    res.render('projects', { project });  // Changed from 'view' to 'projects'
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

app.get('/chats', authenticateToken, async (req, res) => {
    try {
        const UToken = req.cookies?.token;
        if (!UToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        let user = getUser(UToken);

        // Fetch user's chats
        const chats = await Chat.find({ "users.id": user.id });

        let Chatuser = [];
        let u = await Company.findOne({ email: user.Company_email });
        const users = [];
        //console.log("u mems " + u.members);
        //console.log("u sups " + u.supervisors);
        users.push(u.members);
        users.push(u.supervisors);

        for (let i = 0; i < chats.length; i++) {
            let matchedUserId = chats[i].users.find(u => u.id !== user.id)?.id;

            if (matchedUserId) {
                const com = await Company.findOne({
                    $or: [
                        { "members._id": matchedUserId },
                        { "supervisors._id": matchedUserId }
                    ]
                });

                if (com) {
                    Chatuser[i] = com.members.find(mem => mem._id.toString() === matchedUserId) ||
                        com.supervisors.find(sup => sup._id.toString() === matchedUserId) || {};
                } else {
                    Chatuser[i] = {}; // Fallback value to prevent undefined issues
                }
            }
        }
        //console.log(users)
        const us = user.id;

        const GChats = await GChat.find({ "members._id": user.id });

        res.render('chats', { chats, Chatuser, users, us, GChats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get('/sprojects', authenticateToken, async (req, res) => {
    if (req.user.role === "supervisor") {

        const UToken = req.cookies?.token;
        if (!UToken) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        let user = getUser(UToken);
        const projects = await Project.find({ "companyEmail": user.Company_email });
        //console.log(projects);

        const company = await Company.find({ "members.level": "Member", email: req.user.Company_email });
        const members = company.map(c => c.members).flat();
        res.render('sproject', { members, project: projects });  // Changed from 'view' to 'projects'
    } else {
        const referer = req.get('Referer') || "/";
        res.redirect(referer);
    }
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
        const referer = req.get('Referer') || "/";
        res.redirect(referer);
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

app.get('/chat/:id', authenticateToken, async (req, res) => {
    const com = await Company.findOne({ "members._id": req.params.id }) || await Company.findOne({ "supervisors._id": req.params.id });
    let Chatuser = com.members.find(mem => mem._id.toString() === req.params.id) || com.supervisors.find(sup => sup._id.toString() === req.params.id);
    //console.log("chatuser" + Chatuser);
    const UToken = req.cookies?.token;

    let user = getUser(UToken);


    if (user.email === Chatuser.email) {
        const referer = req.get('Referer') || "/home";
        return res.redirect(referer);
    }
    let chatter;
    //console.log("user " + user.role);
    if (user.role === "supervisor") {
        const c = await Company.findOne({ "supervisors._id": req.user.id });
        chatter = c.supervisors.find(sup => sup._id.toString() === req.user.id);
    } else if (user.role === "member") {
        const c = await Company.findOne({ "members._id": req.user.id });
        chatter = c.members.find(mem => mem._id.toString() === req.user.id);
    }

    res.render('chat', { user: chatter, chatter: Chatuser });
});

app.get('/project/:id', authenticateToken, async (req, res) => {
    const project = await Project.findById(req.params.id);
    //console.log(project);
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    //console.log(user);

    const tasks = await Task.find({ "projectID": req.params.id });
    //console.log(tasks);
    const renderedHTML = ejs.render(process.env.PROJECT_SUP, { project });
    //console.log(user.role);
    if (user.role === "supervisor") {
        const s = await Project.findOne({ _id: req.params.id });
        const sup = s.members.find(mem => mem.email === user.email);
        if (sup) {
            res.render('project', { project, tasks, HTML: renderedHTML });
        } else {
            res.render('project', { project, tasks });
        }
    } else {
        res.render('project', { project, tasks });
    }
});

app.get('/project/members/:id', authenticateToken, async (req, res) => {
    const project = await Project.findById(req.params.id);
    const members = project.members;
    const UToken = req.cookies?.token;
    let user = getUser(UToken);


    const renderedHTML = ejs.render(process.env.PROJECT_DEL, { members });
    const s = await Project.findOne({ _id: req.params.id });
    const mem = s.members.find(mem => mem.email === user.email);
    //console.log(mem);
    if (mem) {
        if (mem.level === "Supervisor") {
            res.render('member', { members, HTML: renderedHTML });
        } else {
            res.render('member', { members });
        }
    } else {
        res.render('member', { members });
    }
})



app.get("/file/:id", async (req, res) => {
    try {
        //console.log("Processing file request...");
        const fileId = new ObjectId(req.params.id);

        // Get file metadata
        const files = await conn.db.collection("uploads.files").findOne({ _id: fileId });
        if (!files) {
            return res.status(404).json({ error: "File not found" });
        }

        res.set("Content-Type", files.contentType);

        // Force download for non-image files
        if (!files.contentType.startsWith("image")) {
            res.set("Content-Disposition", `attachment; filename="${files.filename}"`);
        }

        // Create readable stream
        const readstream = gridFSBucket.openDownloadStream(fileId);
        readstream.on("error", (err) => {
            console.error("Stream error:", err);
            res.status(500).json({ error: "File stream error" });
        });

        readstream.pipe(res);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get('/GChats/:id', authenticateToken, async (req, res) => {
    const chat = await GChat.findById(req.params.id);
    //console.log(chat);
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    const id = user.id;
    res.render('group_chat', { chat, id });
})

app.get('/GInvite/:id', authenticateToken, async (req, res) => {
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    const c = await Company.findOne({ email: user.Company_email });
    const chat = await GChat.findById(req.params.id);

    const missingUsers = [];

    // Ensure c.members and c.supervisors are arrays
    const membersArray = Array.isArray(c.members) ? c.members : (c.members ? [c.members] : []);
    const supervisorsArray = Array.isArray(c.supervisors)
        ? c.supervisors
        : (c.supervisors ? [c.supervisors] : []);

    // Combine both arrays into one list for checking
    const usersToCheck = [...membersArray, ...supervisorsArray];

    // For each user in usersToCheck, check if a user with the same email exists in chat.members.
    usersToCheck.forEach(user => {
        const exists = chat.members.some(chatUser => chatUser.email === user.email);
        if (!exists) {
            missingUsers.push(user);
        }
    });

    const id = req.params.id;

    res.render('GInvite', { missingUsers, id });
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
        const referer = req.get('Referer') || "/";
        res.redirect(referer);
    }
}


function getUser(Token, res) {
    let user = null;
    jwt.verify(Token, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.redirect("/login");
        }
        //console.log("ran1");
        user = u;
    });
    return user;
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
        console.log(company.password);
        const hashPassword = await bcrypt.hash(company.password, saltRounds);

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
            password: hashPassword,
            industry: company.industry,
            supervisors: updatedSupervisors,
            members: updatedMembers,
        });

        await newCompany.save();

        //console.log(newCompany.supervisors?.[0]?._id)
        //res.status(201).send({ message: 'Company data added successfully', newCompany });
        // Generate JWT Token
        const token = jwt.sign(
            { id: newCompany.supervisors?.[0]?._id, role: "supervisor", email: newCompany.supervisors?.[0]?.email, Company_email: newCompany.email },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "7h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(token);

        //test to see if token is working
        res.clearCookie("token");
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 7000 // 1 hour expiration
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
            { id: supervisor._id, role: "supervisor", email: supervisor.email, Company_email: companyEmail },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "7h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(token);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.clearCookie("token");
        res.cookie("token", token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 7000 // 1 hour expiration
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
            { id: member._id, role: "member", email: member.email, Company_email: companyEmail },  // Payload
            process.env.JWT_SECRET,                      // Secret Key
            { expiresIn: "7h" }                          // Expiration Time
        );
        //comfirm token
        //console.log(Mtoken);

        //test to see if token is working
        //res.json({ token, role: "supervisor", message: "Login Successful" });
        res.clearCookie("token");
        res.cookie("token", Mtoken, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Helps prevent CSRF attacks
            maxAge: 60 * 60 * 7000 // 1 hour expiration
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
        let sup;
        const UToken = req.cookies?.token;
        if (!UToken) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        //console.log(UToken);

        let user = getUser(UToken);
        //console.log(user);
        if (user.role === "supervisor") {
            const USuper = await Company.findOne({ "supervisors._id": user.id })
            sup = USuper.supervisors.length;

            for (let i = 0; i < sup; i++) {
                if (USuper.supervisors[i]._id == user.id) {
                    let US = USuper.supervisors.find(sup => sup._id.toString() === user.id);
                    req.session.Info = US;
                    return res.json({ supervisor: US });
                }
            }
        } else if (user.role === "member") {
            const Umem = await Company.findOne({ "members._id": user.id });
            sup = Umem.members.length;

            for (let i = 0; i < sup; i++) {
                if (Umem.members[i]._id == user.id) {
                    let UM = Umem.members.find(sup => sup._id.toString() === user.id);
                    req.session.Info = UM;
                    return res.json({ member: UM });
                }
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
        //console.log("password")
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        //console.log("hashedPassword " + hashedPassword);

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
        console.error("Password update error:", error);
        res.status(500).json({ message: "", error: error.message });
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


app.post('/addProject', async (req, res) => {
    try {
        //console.log(req.body);
        let mem = []
        const { projectName, projectDescription, projectStartDate, projectDeadline, projectStatus, members } = req.body;
        //console.log(projectName + " " + projectDescription + " " + projectStartDate + " " + projectDeadline + " " + projectStatus + " " + members);
        mem = await Company.find(
            { "members.email": { $in: members } },
            {
                _id: 1,
                name: 1,
                members: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $in: ["$$member.email", members] }
                    }
                }
            }
        );


        const me = mem.flatMap(m => m.members);
        let member = me.map(({ level, firstName, lastName, email, profile, _id }) => ({ level, firstName, lastName, email, profile, _id }));
        const com = await Company.findOne({ "members.email": member[0].email });


        const UToken = req.cookies?.token;
        let user = getUser(UToken);
        //console.log(user);
        const company = await Company.findOne({ email: user.Company_email }).lean();
        //console.log(company)
        const supervisor = company.supervisors.find(sup => sup._id.toString() === user.id);
        //console.log(supervisor)
        // Ensure members is an array
        const membersArray = Array.isArray(member) ? [...member] : [];
        //console.log("Members:", membersArray);

        // Add supervisor as a new entry, not overwriting existing members
        const superMember = {
            level: supervisor.level,
            firstName: supervisor.firstName,
            lastName: supervisor.lastName,
            email: supervisor.email,
            profile: supervisor.profile,
            id: supervisor._id
        };

        // Push supervisor into the array
        membersArray.push(superMember);

        //console.log("Final Members:", membersArray);


        const newProject = new Project({
            name: projectName,
            description: projectDescription,
            startDate: projectStartDate,
            endDate: projectDeadline,
            status: projectStatus,
            companyEmail: com.email,
            members: membersArray
        });
        //console.log("project" + newProject);

        await newProject.save();
        res.status(201).send({ message: 'Project data added successfully' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
    }
});


app.post('/addChat', upload, async (req, res) => {
    try {
        const { user, message, time, profile, chatter, date } = req.body;
        //console.log("Uploaded Files:", req.files);


        // Extract file IDs properly
        //console.log(req.files);
        const fileIds = req.files ? req.files.map(file => file.id) : [];

        //console.log("Uploaded File IDs:", fileIds);

        // Check if a chat already exists between the two users
        let existingChat = await Chat.findOne({ "users.id": user, "users.id": chatter });

        if (!existingChat) {
            const newChat = new Chat({
                users: [
                    { id: chatter },
                    { id: user }
                ],
                input: {
                    profile: profile,
                    sender: user,
                    message: message,
                    timestamp: time,
                    file: fileIds, // Store file IDs
                    date: date
                }
            });
            await newChat.save();
            //console.log("New Chat Created!");
        } else {
            await Chat.findOneAndUpdate(
                { "users.id": user, "users.id": chatter },
                {
                    $push: {
                        input: {
                            profile: profile,
                            sender: user,
                            message: message,
                            timestamp: time,
                            date: date,
                            file: fileIds
                        }
                    }
                },
                { new: true, runValidators: true }
            );
            //console.log("Chat Updated!");
        }

        res.status(200).json({ message: "Chat saved successfully", files: fileIds });

    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'An error occurred while saving the data', error });
    }
});



app.post('/get-messages', async (req, res) => {
    try {
        const { user, chatter } = req.body;
        //console.log("user " + user + " chatter " + chatter);
        let existingChat = await Chat.findOne({ "users.id": user, "users.id": chatter });
        if (existingChat) {
            const messages = await Chat.findOne({ "users.id": user, "users.id": chatter });
            res.json(messages.input);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ message: 'An error occurred while fetching the data', error });
    }
});

app.post('/get-Gmessages/:id', async (req, res) => {
    try {
        const id = req.body.id;
        // For simplicity, fetch the first available group chat.
        // You can adjust this to use a group chat ID from req.body if needed.
        const groupChat = await GChat.findOne(id);
        if (!groupChat) {
            return res.status(404).json({ error: 'Group chat not found.' });
        }
        //console.log("Group Chat:", groupChat);
        // Return the messages stored in the "input" array
        res.json(groupChat.input);
    } catch (error) {
        console.error("Error fetching group messages:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
})

app.post('/add-worker', async (req, res) => {
    //console.log(req.body);
    const { role, firstName, lastName, email, password, type } = req.body;
    const UToken = req.cookies.token;
    let user = getUser(UToken);
    //console.log(user);
    try {
        const company = await Company.findOne({ email: user.Company_email });
        if (company) {
            const existingSupervisor = company.supervisors.find(sup => sup.email === email);
            const existingMember = company.members.find(mem => mem.email === email);
            if (existingSupervisor || existingMember) {
                return res.status(400).json({ message: "Worker already exists" });
            }
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            if (type === "supervisor") {
                company.supervisors.push({
                    role: role,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: hashedPassword,
                    profile: DEFAULT_PROFILE_IMAGE
                });
            } else if (type === "member") {
                company.members.push({
                    role: role,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: hashedPassword,
                    profile: DEFAULT_PROFILE_IMAGE
                });
            }
            //console.log(company);
            await company.save();
            res.status(201).json({ success: true, message: "Worker successfully added!" });
        } else {
            res.status(404).json({ message: "Company not found" });
        }
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
    }
});


app.post('/add-task', async (req, res) => {
    try {
        const { taskName, taskDescription, taskStartDate, taskEndDate, members, url } = req.body;
        const UToken = req.cookies.token;

        // Validate request body
        if (!taskName || !taskDescription || !taskStartDate || !taskEndDate || !members || !Array.isArray(members)) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        // Verify JWT Token
        let user = getUser(UToken);

        // Find the company
        const company = await Company.findOne({ email: user.Company_email });


        // Check if the user is a supervisor
        const supervisor = company.supervisors.find(sup => sup._id.toString() === user.id);
        if (!supervisor) {
            return res.status(403).json({ message: "Unauthorized: Only supervisors can add tasks" });
        }

        // Validate Members
        let memberList = [];
        for (let i = 0; i < members.length; i++) {
            let found = company.members.find(mem => mem.email === members[i]);
            //console.log("Found:", found);
            if (found) {
                memberList.push(found);
            }
        }


        memberList.push(supervisor);
        //console.log("memberList: " + memberList);

        const newTask = new Task({
            task: taskName,
            description: taskDescription,
            start: taskStartDate,
            end: taskEndDate,
            projectID: url,
            compantEmail: user.Company_email,
            members: memberList.map(member => ({
                id: member._id,
                level: member.level,
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                role: member.role,
                profile: member.profile
            }))
        });

        await newTask.save();

        // all checks are passed so proceed with task creation.
        return res.status(200).json({ message: "Task validation successful", members: memberList });

    } catch (error) {
        console.error("Error adding task:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/update-task/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;

        //console.log("Progress:", progress);
        //console.log("Task ID:", id);

        // Find the task
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Update task progress
        existingTask.progress = progress;

        await existingTask.save();

        return res.status(200).json({ message: "Task updated successfully", task: existingTask });
    } catch (error) {
        console.error("Error updating task:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post("/getFiles", async (req, res) => {
    try {
        const { fileIds } = req.body; // Get file IDs from request

        if (!fileIds || !Array.isArray(fileIds)) {
            return res.status(400).json({ error: "Invalid file IDs" });
        }

        // Convert string IDs to MongoDB ObjectIds
        const objectIds = fileIds.map(id => new ObjectId(id));

        // Retrieve files from GridFS
        const files = await conn.db.collection("uploads.files").find({ _id: { $in: objectIds } }).toArray();
        //console.log(files);

        if (!files || files.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }

        res.json(files); // Send file details back
    } catch (error) {
        console.error("Error retrieving files:", error);
        res.status(500).json({ error: "Server error" });
    }
});


app.post('/delete/:email/:id', async (req, res) => {
    try {

        const UToken = req.cookies?.token;
        let user = getUser(UToken);
        const { email, id } = req.params;
        //console.log("email " + email + " id " + id);

        const Mcompany = await Project.findOne({ _id: id });

        const member = Mcompany.members.find(mem => mem.email === email);

        if (member.level === "Supervisor" && user.level === "Supervisor") {
            //console.log("supervisor");
            await Company.updateOne(
                { _id: Mcompany._id },
                { $pull: { supervisors: { email: req.params.email } } }
            );
            res.status(201).json({ message: "User deleted successfully", status: 201 });
        } else {
            //console.log("member");
            await Project.updateOne(
                { _id: Mcompany._id },
                { $pull: { members: { email: email } } }
            );
            res.status(200).json({ message: "User deleted successfully", status: 200 });
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post('/admin', async (req, res) => {
    const password = req.body.password;

    const UToken = req.cookies?.token;
    let user = getUser(UToken);

    const company = await Company.findOne({ email: user.Company_email });

    const isMatch = await bcrypt.compare(password, company.password);
    if (isMatch == false) {
        //console.log("Invalid password");
        return res.status(400).json({ message: "Invalid password" });
    } else {
        //console.log("Password Matched");
        return res.status(200).json({ message: "Password Matched" });
    }
})

app.post('/delete/:id', async (req, res) => {
    try {
        //console.log(req.params);
        const { id } = req.params;
        //console.log("id " + id);

        const UToken = req.cookies?.token;
        let user = getUser(UToken);
        //console.log(user.id);

        if (user.id == id) {
            //console.log("You cannot delete yourself");
            return res.status(200).json({ message: "You cannot delete yourself" });
        }

        const company = await Company.findOne({
            "supervisors._id": id
        });

        await Company.updateOne(
            { _id: company._id },
            { $pull: { supervisors: { _id: id } } }
        );
        return res.status(200).json({ message: "User Deleted", status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/makeChat', async (req, res) => {
    const chatName = req.body.chatName;
    let Members = req.body.membersList;
    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    Members += user.id;
    try {
        const c = await Company.find({ "email": user.Company_email });

        Members = Members.split(',');
        // console.log(Members.length);
        // console.log(Members);
        let memb = [];
        for (let i = 0; i < Members.length; i++) {
            // Find the member in either members or supervisors array
            const com = c[0].members.find(mem => mem._id.toString() === Members[i]) ||
                c[0].supervisors.find(sup => sup._id.toString() === Members[i]);
            if (com) {
                memb.push(com);
            }
        }

        const newGChat = new GChat({
            name: chatName,
            email: user.Company_email,
            members: memb,
        });

        await newGChat.save();
        //console.log(newGChat.id);
        res.redirect('/GChats/' + newGChat._id);


    } catch (error) {
        console.error("Error making chat:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post('/addGChat/:id', upload, async (req, res) => {
    try {
        const fileIds = req.files ? req.files.map(file => file.id) : [];
        const { message, time, date, } = req.body;
        const UToken = req.cookies?.token;

        let user = getUser(UToken);

        const id = req.params.id;

        const sender = await Company.findOne({ "members._id": user.id }) || await Company.findOne({ "supervisors._id": user.id });
        const profile = sender.members.find(mem => mem._id.toString() === user.id) || sender.supervisors.find(sup => sup._id.toString() === user.id);
        await GChat.findByIdAndUpdate(id, { $push: { input: { profile: profile.profile, firstName: profile.firstName, lastName: profile.lastName, id: user.id, file: fileIds, message: message, timestamp: time, date: date } } }, { new: true, runValidators: true });
        res.status(200).json({ message: "Chat saved successfully" });

    } catch {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/addGInvite/:id', async (req, res) => {
    const id = req.params.id;
    const members = req.body.userId;
    //console.log(members);

    try {
        const UToken = req.cookies?.token;
        let user = getUser(UToken);
        const company = await Company.findOne({ email: user.Company_email }) || await Company.findOne({ email: user.Company_email });
        //console.log(company);
        const mem = company.members.find(mem => mem._id.toString() === members) || company.supervisors.find(sup => sup._id.toString() === members);
        //console.log(mem);
        await GChat.findByIdAndUpdate(id, { $push: { members: mem } }, { new: true, runValidators: true });
        res.status(200).json({ message: "User added successfully" });
    } catch {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});