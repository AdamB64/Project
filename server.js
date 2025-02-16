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

//how many round should be used to generate the encrypted password
const saltRounds = process.env.SALT;

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
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads"); // GridFS Bucket Name
});

// GridFS Storage
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
    let user = null;
    jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        user = u;
    });
    if (user.id === req.params.id) {
        //console.log("user");
        res.redirect('/user');
    } else {
        res.render('profile', { worker });
    }
})

app.get('/projects', authenticateToken, async (req, res) => {
    const UToken = req.cookies?.token;
    let user = null;
    jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        user = u;
    });
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
        let user = null;

        jwt.verify(UToken, process.env.JWT_SECRET, async (err, u) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            user = u;

            // Fetch user's chats
            const chats = await Chat.find({ "users.id": user.id });

            let Chatuser = [];

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

            res.render('chats', { chats, Chatuser });
        });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get('/sprojects', authenticateToken, async (req, res) => {
    if (req.user.role === "supervisor") {
        let user
        const UToken = req.cookies?.token;
        if (!UToken) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            user = u;
        });
        const projects = await Project.find({ "companyEmail": user.Company_email });
        //console.log(projects);

        const company = await Company.find({ "members.level": "Member", email: req.user.Company_email });
        const members = company.map(c => c.members).flat();
        res.render('sproject', { members, project: projects });  // Changed from 'view' to 'projects'
    } else {
        res.redirect("/");
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

app.get('/chat/:id', authenticateToken, async (req, res) => {
    const com = await Company.findOne({ "members._id": req.params.id }) || await Company.findOne({ "supervisors._id": req.params.id });
    let Chatuser = com.members.find(mem => mem._id.toString() === req.params.id) || com.supervisors.find(sup => sup._id.toString() === req.params.id);
    //console.log("chatuser" + Chatuser);
    const UToken = req.cookies?.token;

    let user = null;
    jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        //console.log("ran1");
        user = u;
    });
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
    let user = null;
    jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        user = u;
    });
    const tasks = await Task.find({ "projectID": req.params.id });
    //console.log(tasks);
    const renderedHTML = ejs.render(process.env.PROJECT_SUP, { project });
    const s = await Project.findOne({ _id: req.params.id });
    const sup = s.members.find(mem => mem.email === user.email);
    if (sup.level === "Supervisor") {
        res.render('project', { project, tasks, HTML: renderedHTML });
    } else {
        res.render('project', { project, tasks });
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
            { id: newCompany.supervisors?.[0]?._id, role: "supervisor", email: newCompany.supervisors?.[0]?.email, Company_email: newCompany.email },  // Payload
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
            { id: supervisor._id, role: "supervisor", email: supervisor.email, Company_email: companyEmail },  // Payload
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
            { id: member._id, role: "member", email: member.email, Company_email: companyEmail },  // Payload
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
        let sup;
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
        let member = me.map(({ level, firstName, lastName, email, profile }) => ({ level, firstName, lastName, email, profile }));
        const com = await Company.findOne({ "members.email": member[0].email });


        const UToken = req.cookies?.token;
        let user = null;
        jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            //console.log("ran1");
            user = u;
        });
        //console.log(user);
        const company = await Company.findOne({ email: user.Company_email }).lean();
        //console.log(company)
        const supervisor = company.supervisors.find(sup => sup._id.toString() === user.id);
        //console.log(supervisor)
        // Ensure members is an array
        const membersArray = Array.isArray(member) ? [...member] : [];

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
        res.status(201).send({ message: 'Project data added successfully', newProject });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
    }
});


app.post('/addChat', upload, async (req, res) => {
    try {
        const { user, message, time, profile, chatter, date } = req.body;
        const fileIds = req.files.map(file => file.id);
        //console.log(fileIds)

        // Convert to JSON string for proper display
        //console.log(JSON.stringify(req.files, null, 2));

        //check if a chat already exists between the two users
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
                    file: fileIds,
                    date: date
                }
            });
            await newChat.save();
        } else {
            await Chat.findOneAndUpdate(
                { "users.id": user, "users.id": chatter },
                { $push: { input: { profile: profile, sender: user, message: message, timestamp: time, date: date, file: fileIds } } },
                { new: true, runValidators: true }
            );
        }
    }
    catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
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

app.post('/add-worker', async (req, res) => {
    //console.log(req.body);
    const { role, firstName, lastName, email, password, type } = req.body;
    const UToken = req.cookies.token;
    let user = null;
    jwt.verify(UToken, process.env.JWT_SECRET, (err, u) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        user = u;
    });
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
        let user;
        try {
            user = jwt.verify(UToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }

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

        // Retrieve files from GridFS
        const files = await gfs.files.find({ _id: { $in: fileIds.map(id => new mongoose.Types.ObjectId(id)) } }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }

        res.json(files); // Send file details back
    } catch (error) {
        console.error("Error retrieving files:", error);
        res.status(500).json({ error: "Server error" });
    }
});





// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
