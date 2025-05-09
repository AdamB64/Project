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
const STask = require('./mongo/sub_task.js');
const PChat = require('./mongo/PChat.js');
const TaskChat = require('./mongo/TChat.js');
const { ObjectId, GridFSBucket } = require("mongodb");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const cookieParser = require("cookie-parser");
const ejs = require('ejs');
const multer = require("multer");




//declare the html variable to be used in the ejs file
const MEM_ROLE = `
<div id="members">
  <div id="sidebar">
    <ul class="top-section">
      <li><a class="sideA" href="/Projects">Projects</a></li>
      <li><a class="sideA" href="/Chats">Chats</a></li>
    </ul>
    <ul class="bottom-section">
      <li><a class="sideA" href="/User">User</a></li>
      <li>
        <form action="/logout" method="POST">
          <button class="sideA" type="submit">Logout</button>
        </form>
      </li>
    </ul>
  </div>
</div>
`;

const SUB_ROLE = `
<div id="super">
  <div id="sidebar">
    <ul class="top-section">
      <li><a class="sideA" href="/members">Members</a></li>
      <li><a class="sideA" href="/SProjects">Companys Projects</a></li>
      <li><a class="sideA" href="/projects">Projects</a></li>
      <li><a class="sideA" href="/Chats">Chats</a></li>
      <li><a class="sideA" href="/invite">Invite</a></li>
    </ul>
    <ul class="bottom-section">
      <li><a class="sideA" href="/User">User</a></li>
      <li>
        <form action="/logout" method="POST">
          <button class="sideA" type="submit">Logout</button>
        </form>
      </li>
    </ul>
  </div>
</div>
<script>
const ul = document.getElementById("HDList");
const newLi = document.createElement('li');
newLi.className = 'HDLitem';
const newLink = document.createElement('a');
newLink.href = '/admin';
newLink.className = 'HDLitemLink';
newLink.textContent = 'Admin';
newLi.appendChild(newLink);
ul.appendChild(newLi);
</script>
`;

const PROJECT_SUP = `
<div>
  <button class="button" onclick="showAddTaskModal()">Add Task</button>
</div>
<div id="cover">
  <form id="form" style="display: none">
    <h1>
      Create a task that will have a set start date and deadline inside these dates
      <%= new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) %> and
      <%= new Date(project.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) %>
      and will have members assigned to the Task
    </h1>
    <label for="taskName">Task Name:</label>
    <input type="text" id="taskName" name="taskName" required><br>
    <label for="taskDescription">Task Description:</label>
    <input type="text" id="taskDescription" name="taskDescription" required>
    <label for="taskWeight">Importance</label>
    <select id="taskWeight" name="taskWeight">
      <option value="3">High</option>
      <option value="2">Medium</option>
      <option value="1">Low</option>
    </select><br>
    <label for="taskStartDate">Task Start Date:</label>
    <input type="date" id="taskStartDate" name="taskStartDate" required><br>
    <label for="taskEndDate">Task End Date:</label>
    <input type="date" id="taskEndDate" name="taskEndDate" required><br>
    <label for="taskMembers">Task Members:</label>
    <select id="taskMembers" name="taskMembers" required>
      <option value="" disabled selected>Select a member</option>
      <% project.members.forEach((member) => { %>
        <% if (member.level !== "Supervisor") { %>
          <option value="<%= member.email %>"><%= member.level %> <%= member.firstName %> <%= member.lastName %></option>
        <% } %>
      <% }) %>
    </select>
    <button type="button" class="button" onclick="addMember()">Add selected member</button><br>
    <list id="memberList"></list>
    <button type="submit" class="button">Add Task</button>
  </form><br>
  <button style="display: none" id="close" class="button" onclick="hideAddTaskModal()">Close</button>
</div>
`;

const PROJECT_DEL = `
<button class="button" onclick="deleteMem('<%= members.email %>')">Delete</button>
<script>
function deleteMem(users) {
  const pathname = window.location.pathname;
  const id = pathname.split('/').pop();
  console.log(users);
  fetch(\`/delete/\${users}/\${id}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    if (data.status === 200) {
      alert('Member Deleted');
      window.location.reload();
    } else if (data.status === 201) {
      alert('Supervisor was deleted');
    }
  })
  .catch(err => {
    console.log(err);
  });
}
</script>
`;


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
  res.render('about');
});

app.get('/user', authenticateToken, (req, res) => {
  //console.log("session " + [req.session.Info]);
  const users = req.session.Info ? [req.session.Info] : [];
  res.render('user', { users: users });
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
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  const task = await Task.findById(req.params.id);
  //console.log(req.params.id);
  const TChat = await TaskChat.find({ taskId: req.params.id });
  //console.log(TChat);
  //console.log(task);

  //console.log(task.members);

  const company = await Company.findOne({ email: task.compantEmail });
  let mems = []
  let profiles = [];


  for (let i = 0; i < task.members.length; i++) {
    const taskMember = task.members[i];

    // Find the member in company members
    let mem = company.members.find(mem => mem._id.toString() === taskMember.id);

    // If not found, search in supervisors
    if (!mem) {
      mem = company.supervisors.find(sup => sup._id.toString() === taskMember.id);
    }

    if (mem) {
      //console.log(mem);
      profiles.push({ _id: mem._id, profile: mem.profile });
      mems.push(mem);
    }
  }

  const UToken = req.cookies?.token;
  let user = getUser(UToken);

  const sub_task = await STask.find({ "TaskID": req.params.id });
  //console.log(task);
  res.render('task', { task, sub_task, members: mems, profiles, chat: TChat, id: user.id });
});

app.get('/profile/:id', authenticateToken, async (req, res) => {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
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
});

app.get('/projects', authenticateToken, async (req, res) => {
  const UToken = req.cookies?.token;
  let user = getUser(UToken);
  //console.log(user.email);
  const project = await Project.find({ "members.email": user.email });
  //console.log(project);
  res.render('projects', { project });
});

app.get('/create', (req, res) => {
  res.render('create');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/home', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent chats
    const chats = await Chat.find({ 'users.id': userId })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(); // enables direct modification of chat objects

    for (let chat of chats) {
      // Find the other user's ID
      const otherUserRef = chat.users.find(u => u.id !== userId);
      if (!otherUserRef) {
        chat.otherUser = null;
        continue;
      }

      // Find the other user in Company (either in supervisors or members)
      const company = await Company.findOne({
        $or: [
          { 'supervisors._id': otherUserRef.id },
          { 'members._id': otherUserRef.id }
        ]
      });

      let fullUser = null;
      if (company) {
        fullUser =
          company.supervisors.find(s => s._id.toString() === otherUserRef.id) ||
          company.members.find(m => m._id.toString() === otherUserRef.id);
      }

      // Replace `users` field with just the basic info of the other user
      if (fullUser) {
        chat.user = {
          id: otherUserRef.id,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          email: fullUser.email,
          profile: fullUser.profile
        };
      } else {
        chat.user = null;
      }

      delete chat.users; // remove the original users array
    }

    const groupChats = await GChat.find({ 'members._id': req.user.id })
      .sort({ updatedAt: -1 }) // Most recently updated first
      .limit(4);               // Only return 4 chats

    const ProjectChats = await PChat.find({ 'members.id': req.user.id })
      .sort({ updatedAt: -1 }) // Most recently updated first
      .limit(4);               // Only return 4 chats

    const TaskChats = await TaskChat.find({ 'members.id': req.user.id })
      .sort({ updatedAt: -1 }) // Most recently updated first
      .limit(4);               // Only return 4 chats

    // Determine role-based sidebar code
    let code;
    if (req.user.role === "supervisor") {
      code = SUB_ROLE;
    } else if (req.user.role === "member") {
      code = MEM_ROLE;
    }

    res.render('home', { Code: code, chat: chats, groupChats, ProjectChats, TaskChats });

  } catch (err) {
    console.error('Error getting chats:', err);
    res.status(500).send('Server error');
  }
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

    const PChats = await PChat.find({ "members.id": user.id });
    const TChats = await TaskChat.find({ "members.id": user.id });
    //console.log(PChats);

    res.render('chats', { chats, Chatuser, users, us, GChats, PChat: PChats, TChat: TChats });
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
    res.render('sproject', { members, project: projects });
  } else {
    const referer = req.get('Referer') || "/";
    res.redirect(referer);
  }
});


app.get('/Members', authenticateToken, async (req, res) => {
  if (req.user.role === "supervisor") {
    //console.log(req.user);
    const company = await Company.find({ "members.level": "Member", email: req.user.Company_email });
    const member = company.map(c => c.members).flat();

    //console.log(members);
    res.render('Members', { members: member });
  }
  else {
    const referer = req.get('Referer') || "/";
    res.redirect(referer);
  }
});

app.get('/invite', authenticateToken, (req, res) => {
  //console.log(req.user);
  if (req.user.role === "supervisor") {
    //console.log(req.user);
    res.render('invite');
  }
  else {
    res.redirect("/");
  }
});

app.get('/chat/:id', authenticateToken, async (req, res) => {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
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
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  const project = await Project.findById(req.params.id);
  //console.log(project);
  const UToken = req.cookies?.token;
  let user = getUser(UToken);
  //console.log(user);

  const tasks = await Task.find({ "projectID": req.params.id });
  //console.log(tasks);
  const renderedHTML = ejs.render(PROJECT_SUP, { project });
  //console.log(user.role);
  //console.log(renderedHTML);
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
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  const project = await Project.findById(req.params.id);
  const members = project.members;
  const UToken = req.cookies?.token;
  let user = getUser(UToken);

  let renderedHTML = [];
  for (let i = 0; i < members.length; i++) {
    renderedHTML.push(ejs.render(PROJECT_DEL, { members: members[i] }));
  }
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
});


app.get('/project/chat/:id', authenticateToken, async (req, res) => {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  const { id } = req.params;
  const profiles = [];
  //console.log("project id " + id);

  // ✅ Validate the ID BEFORE trying to cast it
  if (!id || !ObjectId.isValid(id)) {
    //console.warn("Invalid project ID received:", id);
    return res.status(400).send("Invalid project ID");
  }

  try {
    const objectId = new ObjectId(id);

    const project = await Project.findOne({ _id: objectId });
    if (!project) return res.status(404).send("Project not found");

    const members = project.members || [];

    const validMemberIds = members
      .map(m => m._id)
      .filter(_id => _id && ObjectId.isValid(_id));

    for (let i = 0; i < members.length; i++) {
      const memId = members[i]._id;

      const con = await Company.findOne({ "members._id": memId }) || await Company.findOne({ "supervisors._id": memId });

      if (!con) {
        alertMessage.push(`User ${members[i].firstName} ${members[i].lastName} has been deleted from the company.`);
        await Project.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $pull: { members: { _id: memId } } },
          { new: true }
        );
      } else {
        const found =
          con.members.find(mem => mem.email === members[i].email) ||
          con.supervisors.find(sup => sup.email === members[i].email);
        if (found) {
          profiles.push({ _id: found._id, profile: found.profile });
        }
      }
    }

    const Pchat = await PChat.find({ projectId: id });

    if (!Pchat || Pchat.length === 0) {
      return res.render('PChat', {
        chat: [],
        profiles: users,
        id: req.user.id,
        errorMessage: "No chat history yet."
      });
    }
    //console.log(profiles)

    res.render('PChat', { chat: Pchat, profiles: profiles, id: req.user.id });

  } catch (err) {
    console.error("Error rendering PChat:", err);
    res.status(500).send("Server Error");
  }
});



app.get("/file/:id", async (req, res) => {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  try {
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
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
  try {
    // Check if the ID is a valid ObjectId before querying the database
    const chat = await GChat.find({ _id: req.params.id });
    //console.log(chat);
    const UToken = req.cookies?.token;
    let user = getUser(UToken);

    let profiles = [];
    let alertMessage = [];
    //console.log(chat[0].members.length);

    for (let i = 0; i < chat[0].members.length; i++) {
      //console.log(chat[0].members[i]._id);
      const con = await Company.findOne({ "members._id": chat[0].members[i]._id }) || await Company.findOne({ "supervisors._id": chat[0].members[i]._id });
      //console.log(con);
      if (!con) {
        alertMessage.push(`user ${chat[0].members[i].level} ${chat[0].members[i].firstName} ${chat[0].members[i].lastName} has been delted from the company`);
        await GChat.findOneAndUpdate(
          { _id: req.params.id },
          { $pull: { members: { _id: chat[0].members[i]._id } } },
          { new: true, runValidators: true }
        );
      } else {
        const m = con.members.find(mem => mem.email === chat[0].members[i].email) ||
          con.supervisors.find(sup => sup.email === chat[0].members[i].email);
        const mem = { _id: m._id, profile: m.profile };
        profiles.push(mem);
      }
    }


    const id = user.id;
    //console.log(profiles);
    if (profiles.length === 1) {
      alertMessage.push("Only Chatter left in chat");
    }
    res.render('group_chat', { chat, id, profiles, alertMessage });
  } catch (error) {
    console.error("Error fetching group chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/GInvite/:id', authenticateToken, async (req, res) => {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) {
    return res.status(400).render('404');
  }
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
      if (res) {
        return res.redirect("/login");
      } else {
        throw new Error("Invalid token and no response object provided.");
      }
    }
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
    company.name = company.name.replace(/[<>'"!&]/g, '');
    company.email = company.email.replace(/[<>'"!&]/g, '');
    company.address = company.address.replace(/[<>'"!&]/g, '');
    company.industry = company.industry.replace(/[<>'"!&]/g, '');
    for (let i = 0; i < supervisors.length; i++) {
      supervisors[i].firstName = supervisors[i].firstName.replace(/[<>'"!&]/g, '');
      supervisors[i].lastName = supervisors[i].lastName.replace(/[<>'"!&]/g, '');
      supervisors[i].email = supervisors[i].email.replace(/[<>'"!&]/g, '');
      supervisors[i].role = supervisors[i].role.replace(/[<>'"!&]/g, '');
    }
    for (let i = 0; i < members.length; i++) {
      members[i].firstName = members[i].firstName.replace(/[<>'"!&]/g, '');
      members[i].lastName = members[i].lastName.replace(/[<>'"!&]/g, '');
      members[i].email = members[i].email.replace(/[<>'"!&]/g, '');
      members[i].password = members[i].password.replace(/[<>'"!&]/g, '');
    }

    //make sure that the company, supervisors, and members emails are not already in the database
    const companyExists = await Company.findOne({ email: company.email });
    if (companyExists) { return res.status(201).send({ message: 'Company already exists' }); }
    const supervisorExists = await Company.findOne({ "supervisors.email": supervisors[0].email });
    if (supervisorExists) { return res.status(201).send({ message: 'Supervisor already exists' }); }
    const memberExists = await Company.findOne({ "members.email": members[0].email });
    if (memberExists) { return res.status(201).send({ message: 'Member already exists' }); }
    //console.log(company.password);
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
      maxAge: 60 * 60 * 7000 // 7 hour expiration
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
      maxAge: 60 * 60 * 7000 // 7 hour expiration
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
      maxAge: 60 * 60 * 7000 // 7 hour expiration
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

app.post('/users', authenticateToken, async (req, res) => {
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
      const USuper = await Company.findOne({ "supervisors._id": user.id });
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

app.post('/change-password/:userId', authenticateToken, async (req, res) => {
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
app.post("/upload-profile", authenticateToken, async (req, res) => {
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


app.post('/addProject', authenticateToken, async (req, res) => {
  try {
    //console.log(req.body);
    let mem = [];
    let { projectName, projectDescription, projectStartDate, projectDeadline, members } = req.body;
    projectName = projectName.replace(/[<>'"!&]/g, '');
    projectDescription = projectDescription.replace(/[<>'"!&]/g, '');
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
      companyEmail: com.email,
      members: membersArray
    });

    const chat = new PChat({
      projectName: projectName,
      projectId: newProject._id,
      members: membersArray,
      email: com.email
    });

    await chat.save();
    //console.log("project" + newProject);

    await newProject.save();
    res.status(201).send({ message: 'Project data added successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send({ message: 'An error occurred while saving the data', error });
  }
});


app.post('/update-project/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Fetch all tasks associated with the project
    const tasks = await Task.find({ projectID: id });

    if (tasks.length === 0) {
      project.progress = 0;
      await project.save();
      return res.status(200).json({ message: "Project progress updated", project });
    }

    // Step 1: Calculate total weight of tasks
    const totalWeight = tasks.reduce((sum, task) => sum + (task.importance || 1), 0);

    let progressSum = 0;

    // Step 2: Calculate weighted progress dynamically
    tasks.forEach(task => {
      let weight = ((task.importance || 1) / totalWeight) * 100; // Assign weight as a percentage of 100
      let completionFactor = task.progress / 100; // Convert task progress to a factor (0 to 1)
      progressSum += weight * completionFactor;
    });

    // Step 3: Ensure project progress scales to 100%
    const progress = progressSum.toFixed(2);

    // Update project progress
    project.progress = progress;
    await project.save();

    res.status(200).json({ message: "Project progress updated successfully", project });
  } catch (error) {
    console.error("Error updating project progress:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



app.post('/addChat', authenticateToken, upload, async (req, res) => {
  try {
    let { user, message, time, profile, chatter, date } = req.body;
    message = message.replace(/[<>'"!&]/g, '');
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



app.post('/get-messages', authenticateToken, async (req, res) => {
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

app.post('/get-Gmessages', authenticateToken, async (req, res) => {
  try {
    const id = req.body.id;
    const groupChat = await GChat.findOne({ _id: id });
    //console.log("Group Chat:", groupChat);
    if (!groupChat) {
      return res.json([]);
    }
    //console.log("Group Chat:", groupChat);
    // Return the messages stored in the "input" array
    res.json(groupChat.input);
  } catch (error) {
    //console.error("Error fetching group messages:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/get-Pmessages', authenticateToken, async (req, res) => {
  //console.log("get-Pmessages");
  try {
    const id = new ObjectId(req.body.id);
    //console.log("id " + id);
    const projectChat = await PChat.findOne({ _id: id });
    //console.log("Project Chat:", projectChat);
    if (!projectChat.input || !Array.isArray(projectChat.input)) {
      //console.log("input is missing or not an array");
      return res.json([]);
    }

    res.json(projectChat.input || []);
  } catch (error) {
    //console.error("Error fetching group messages:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/get-Tmessages', authenticateToken, async (req, res) => {
  //console.log("get-Tmessages");
  try {
    const id = new ObjectId(req.body.id);
    //console.log("id " + id);
    const projectChat = await TaskChat.findOne({ _id: id });
    //console.log("Project Chat:", projectChat);
    if (!projectChat.input || !Array.isArray(projectChat.input)) {
      //console.log("input is missing or not an array");
      return res.json([]);
    }

    res.json(projectChat.input || []);
  } catch (error) {
    //console.error("Error fetching group messages:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/add-worker', authenticateToken, async (req, res) => {
  //console.log(req.body);
  let { role, firstName, lastName, email, password, type } = req.body;
  role = role.replace(/[<>'"!&]/g, '');
  firstName = firstName.replace(/[<>'"!&]/g, '');
  lastName = lastName.replace(/[<>'"!&]/g, '');
  email = email.replace(/[<>'"!&]/g, '');
  password = password.replace(/[<>'"!&]/g, '');
  type = type.replace(/[<>'"!&]/g, '');
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


app.post('/add-task', authenticateToken, async (req, res) => {
  try {
    let { taskName, taskDescription, taskStartDate, taskEndDate, members, url, taskWeight } = req.body;
    taskName = taskName.replace(/[<>'"!&]/g, '');
    taskDescription = taskDescription.replace(/[<>'"!&]/g, '');

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
      importance: taskWeight,
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

    const newTChat = new TaskChat({
      taskName: taskName,
      taskId: newTask._id,
      members: memberList.map(member => ({
        level: member.level,
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
      })),
      email: user.Company_email
    });
    console.log("newTChat: " + newTChat);
    await newTChat.save();

    // all checks are passed so proceed with task creation.
    return res.status(200).json({ message: "Task validation successful", members: memberList });

  } catch (error) {
    console.error("Error adding task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post('/update-task/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Fetch all subtasks linked to the task
    const subTasks = await STask.find({ TaskID: id });

    if (subTasks.length === 0) {
      task.progress = 0;
      await task.save();
      return res.status(200).json({ message: "Task updated successfully", task });
    }

    // Step 1: Calculate total importance to determine weight distribution
    const totalImportance = + parseInt(subTasks.reduce((sum, sub) => sum + (sub.importance || 1), 0));


    let progressSum = 0;

    // Step 2: Calculate weighted progress dynamically
    subTasks.forEach(sub => {
      let weight = ((parseInt(sub.importance) || 1) / totalImportance) * 100; // Assign weight as a percentage of 100
      let completionFactor = sub.todo === "Done" ? 1 : sub.todo === "Started" ? 0.5 : 0;
      progressSum += weight * completionFactor;
    });

    // Step 3: Ensure progress always scales to 100%
    const progress = progressSum.toFixed(2);

    // Update task progress
    task.progress = progress;
    await task.save();

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});





app.post("/getFiles", authenticateToken, async (req, res) => {
  try {
    const { fileIds } = req.body; // Get file IDs from request
    //console.log("File IDs:", fileIds);

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


app.post('/delete/:email/:id', authenticateToken, async (req, res) => {
  //console.log("ran");
  try {
    const { email, id } = req.params;
    //console.log("email " + email + " id " + id);


    const Mcompany = await Project.findOne({ _id: id });

    //console.log("member");
    await Project.updateOne(
      { _id: Mcompany._id },
      { $pull: { members: { email: email } } }
    );

    await Task.updateMany(
      { projectID: id },
      { $pull: { members: { email: email } } }
    );

    await STask.updateMany(
      { ProjectID: id },
      { $pull: { members: { email: email } } }
    );
    res.status(200).json({ message: "User deleted successfully", status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post('/admin', authenticateToken, async (req, res) => {
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
});

app.post('/delete/:id', authenticateToken, async (req, res) => {
  try {
    //console.log(req.params);
    const { id } = req.params;
    //console.log("id " + id);

    await Chat.deleteMany({ "users.id": id });



    const UToken = req.cookies?.token;
    let user = getUser(UToken);
    //console.log(user.id);

    if (user.id == id) {
      //console.log("You cannot delete yourself");
      return res.status(200).json({ message: "You cannot delete yourself" });
    }

    const company = await Company.findOne({
      "supervisors._id": id
    }) || await Company.findOne({
      "members._id": id
    });



    // Remove members from related collections
    await GChat.updateMany({}, { $pull: { members: { id: id } } });
    await Project.updateMany({}, { $pull: { members: { _id: id } } });
    await Task.updateMany({}, { $pull: { members: { id: id } } });
    await STask.updateMany({}, { $pull: { members: { id: id } } });

    await Company.updateOne({ _id: company._id }, { $pull: { supervisors: { _id: id } } });
    await Company.updateOne({ _id: company._id }, { $pull: { members: { _id: id } } });

    return res.status(200).json({ message: "User Deleted", status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/makeChat', authenticateToken, async (req, res) => {
  let chatName = req.body.chatName;
  chatName = chatName.replace(/[<>'"!&]/g, '');
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


app.post('/addGChat/:id', authenticateToken, upload, async (req, res) => {
  try {
    const fileIds = req.files ? req.files.map(file => file.id) : [];
    let { message, time, date, } = req.body;
    message = message.replace(/[<>'"!&]/g, '');
    const UToken = req.cookies?.token;

    let user = getUser(UToken);

    const id = req.params.id;

    const sender = await Company.findOne({ "members._id": user.id }) || await Company.findOne({ "supervisors._id": user.id });
    const profile = sender.members.find(mem => mem._id.toString() === user.id) || sender.supervisors.find(sup => sup._id.toString() === user.id);
    await GChat.findByIdAndUpdate(id, { $push: { input: { firstName: profile.firstName, lastName: profile.lastName, id: user.id, file: fileIds, message: message, timestamp: time, date: date } } }, { new: true, runValidators: true });
    res.status(200).json({ message: "Chat saved successfully" });

  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/addPChat/:id', authenticateToken, upload, async (req, res) => {
  //console.log("addPChat");
  //console.log(req.params.id);
  try {
    const fileIds = req.files ? req.files.map(file => file.id) : [];
    let { message, time, date, } = req.body;
    message = message.replace(/[<>'"!&]/g, '');
    const UToken = req.cookies?.token;

    let user = getUser(UToken);

    const id = req.params.id;

    const sender = await Company.findOne({ "members._id": user.id }) || await Company.findOne({ "supervisors._id": user.id });
    const profile = sender.members.find(mem => mem._id.toString() === user.id) || sender.supervisors.find(sup => sup._id.toString() === user.id);
    await PChat.findByIdAndUpdate(id, { $push: { input: { firstName: profile.firstName, lastName: profile.lastName, Userid: user.id, file: fileIds, message: message, timestamp: time, date: date } } }, { new: true, runValidators: true });
    res.status(200).json({ message: "Chat saved successfully" });

  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/addTChat/:id', authenticateToken, upload, async (req, res) => {
  //console.log("addTChat");
  //console.log(req.params.id);
  try {
    const fileIds = req.files ? req.files.map(file => file.id) : [];
    let { message, time, date, } = req.body;
    message = message.replace(/[<>'"!&]/g, '');
    const UToken = req.cookies?.token;

    let user = getUser(UToken);

    const id = req.params.id;

    const sender = await Company.findOne({ "members._id": user.id }) || await Company.findOne({ "supervisors._id": user.id });
    const profile = sender.members.find(mem => mem._id.toString() === user.id) || sender.supervisors.find(sup => sup._id.toString() === user.id);
    await TaskChat.findByIdAndUpdate(id, { $push: { input: { firstName: profile.firstName, lastName: profile.lastName, Userid: user.id, file: fileIds, message: message, timestamp: time, date: date } } }, { new: true, runValidators: true });
    res.status(200).json({ message: "Chat saved successfully" });

  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
);

app.post('/addGInvite/:id', authenticateToken, async (req, res) => {
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

app.post('/add-Sub_Task/:id', authenticateToken, async (req, res) => {
  //console.log(req.body);
  const taskId = req.params.id;
  let { taskName, description, startDate, endDate, importance } = req.body;
  taskName = taskName.replace(/[<>'"!&]/g, '');
  description = description.replace(/[<>'"!&]/g, '');
  startDate = startDate.replace(/[<>'"!&]/g, '');
  endDate = endDate.replace(/[<>'"!&]/g, '');
  importance = importance.replace(/[<>'"!&]/g, '');
  let Members = req.body.members;

  // Confirm that Members is an array; if it's a string, convert it to an array
  if (!Array.isArray(Members)) {
    Members = [Members];
  }

  //console.log("Members Count:", Members.length);

  try {
    //console.log("Task ID:", taskId);
    const user = await Task.findOne({ _id: taskId });
    const project = await Project.findOne({ _id: user.projectID });
    //console.log("Project:", project);

    if (!user) {
      return res.status(404).json({ message: "Task not found" });
    }
    let foundMembers = [];

    for (let i = 0; i < Members.length; i++) {  // Fixed loop condition
      let member = Members[i];
      //console.log(`Processing member: ${member}`);

      let matchedMember = user.members.find(mem => mem.id === member);
      //console.log("Matched user member:", matchedMember ? matchedMember.id : "Not Found");



      if (matchedMember) {
        foundMembers.push(matchedMember);
        //console.log("Matched user member:", matchedMember.id);
      } else {
        console.log(`No matching member found for: ${member}`);
      }
    }

    const UToken = req.cookies?.token;
    let user1 = getUser(UToken);

    Sub_Task = new STask({
      task: taskName,
      description: description,
      start: startDate,
      end: endDate,
      ProjectID: project._id,
      TaskID: taskId,
      importance: importance,
      companyEmail: user1.Company_email,
      members: foundMembers
    });

    await Sub_Task.save();

    res.status(200).json({ message: "Sub-task added successfully" });
  } catch (error) {
    console.error("Error adding sub-task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/update-Sub_Task/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { Progress } = req.body;

    //console.log("Progress:", Progress);
    //console.log("Task ID:", id);

    // Find the task
    const existingTask = await STask.findById(id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }


    // Update task progress
    existingTask.todo = Progress;

    await existingTask.save();

    return res.status(200).json({ message: "Task updated successfully", task: existingTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/deleteGroup', authenticateToken, async (req, res) => {
  //console.log("ran");
  try {
    //console.log(req.body);
    const id = req.body.id;
    //console.log("id " + id);
    await GChat.deleteOne({ _id: id });
    res.status(200).json({ message: "Group Deleted" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



// ======= 404 handler (only for wrong / non-existing URLs) =======
app.use((req, res) => {
  res.status(404).render('404');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});