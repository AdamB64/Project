# Flow

A web-based project management system that allows users to create, manage, and track projects and user activities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies](#technologies)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)

## Overview

Flow is a full-featured project management platform designed for team collaboration, role-based project tracking, and real-time communication. It provides tools for supervisors to manage teams and for members to effectively contribute to projects and tasks.

## Features

- User authentication using JWT and session-based tokens.
- Role-based access control for supervisors and members.
- Project creation, task assignment, and sub-task tracking.
- Sub-tasks are displayed as a **To-Do list** with statuses: `Not Started`, `Started`, `Done`.
- Tasks and sub-tasks have an **importance level** from `Low` to `High`.
- **Progress tracking is weighted by importance** — overall project completion depends on:
  - The importance of each task/sub-task.
  - The number of tasks/sub-tasks completed.
- Profile management, including optional image uploads.
- Real-time chat and group chat functionality.
- Dynamic dashboards for both supervisors and members.
- **User Deletion Flow:**
  - **Members** can be removed from:
    - The **Members page** (removes them from the company entirely).
    - The **Project’s Members list** (removes them from just that project and its associated tasks/sub-tasks).
  - **Supervisors** can only be deleted from the **Admin Page** (requires password).
- **Admin Page** (for supervisors only):
  - Used only to delete other supervisors.
  - Accessed from the **Home page** via button.
  - Requires typing in the **company password**.

## Technologies

- **Frontend:** EJS templates, CSS, JavaScript
- **Backend:** Node.js, Express.js, MongoDB
- **Authentication:** JWT, bcrypt
- **Utilities:** CORS, session cookies, RESTful API


## File Structure
<details> <summary><strong>📁</strong></summary>
Project/<br>
├── CSS/<br>
│   ├── about.css<br>
│   ├── admin.css<br>
│   ├── Chat.css<br>
│   ├── Chats.css<br>
│   ├── create.css<br>
│   ├── GChats.css<br>
│   ├── GInvite.css<br>
│   ├── Header.css<br>
│   ├── home.css<br>
│   ├── Invite.css<br>
│   ├── login.css<br>
│   ├── Members.css<br>
│   ├── PMembers.css<br>
│   ├── profile.css<br>
│   ├── project.css<br>
│   ├── projects.css<br>
│   ├── SProject.css<br>
│   ├── start.css<br>
│   ├── task.css<br>
│   └── users.css<br>
├── images/<br>
│   └── icon.png<br>
├── js/<br>
│   ├── chat.js<br>
│   ├── chats.js<br>
│   ├── create.js<br>
│   ├── GChat.js<br>
│   ├── GInvite.js<br>
│   ├── home.js<br>
│   ├── index.js<br>
│   ├── invite.js<br>
│   ├── login.js<br>
│   ├── project.js<br>
│   ├── SProject.js<br>
│   ├── task.js<br>
│   └── users.js<br>
├── mongo/<br>
│   ├── chats.js<br>
│   ├── company.js<br>
│   ├── group_chats.js<br>
│   ├── mongo.js<br>
│   ├── project.js<br>
│   ├── sub_task.js<br>
│   └── task.js<br>
├── view/<br>
│   ├── about.ejs<br>
│   ├── admin.ejs<br>
│   ├── chat.ejs<br>
│   ├── chats.ejs<br>
│   ├── create.ejs<br>
│   ├── GInvite.ejs<br>
│   ├── group_chat.ejs<br>
│   ├── header.ejs<br>
│   ├── home.ejs<br>
│   ├── Invite.ejs<br>
│   ├── login.ejs<br>
│   ├── member.ejs<br>
│   ├── Members.ejs<br>
│   ├── profile.ejs<br>
│   ├── project.ejs<br>
│   ├── projects.ejs<br>
│   ├── sproject.ejs<br>
│   ├── start.ejs<br>
│   ├── task.ejs<br>
│   └── user.ejs<br>
├── .env<br>
├── .gitignore<br>
├── Design.docx<br>
├── development.docx<br>
├── package.json<br>
├── package-lock.json<br>
├── server.js<br>
└── start.sh<br>
</details>


## Installation

### Prerequisites

- Node.js 21.x or higher
- MongoDB
- Git

### Steps

1. Clone the repository:

```bash
git clone https://github.com/AdamB64/Project.git
```
cd Project

2. Install dependencies:

npm run install-modules

3. Configure environment varibales:

Create a .env file in the root directory and add but also change MONGO_URL, JWT_SECRET and secret:
```env
MONGO_URL="mongo url"
JWT_SECRET="random string of characters"
NODE_ENV="development"
secret="random string of characters"
MEM_ROLE='<div id="members"><div id="sidebar"><ul class="top-section"><li><a class="sideA" href="/Projects">Projects</a></li><li><a class="sideA" href="/Chats">Chats</a></li></ul><ul class="bottom-section"><li><a class="sideA" href="/User">User</a></li><li><form action="/logout" method="POST"><button class="sideA" type="submit">Logout</button></form></li></ul></div></div>'
SUB_ROLE='<div id="super"><div id="sidebar"><ul class="top-section"><li><a class="sideA" href="/members">Members</a></li><li><a class="sideA" href="/SProjects">Companys Projects</a></li><li><a class="sideA" href="projects">Projects</a></li><li><a class="sideA" href="/Chats">Chats</a></li><li><a class="sideA" href="/invite">Invite</a></li></ul><ul class="bottom-section"><li><a class="sideA" href="/User">User</a></li><li><form action="/logout" method="POST"><button class="sideA" type="submit">Logout</button></form></li></ul></div></div><script>const ul=document.getElementById("HDList"); const newLi = document.createElement("li");newLi.className = "HDLitem";const newLink = document.createElement("a");newLink.href = "/admin";newLink.className = "HDLitemLink";newLink.textContent = "Admin";newLi.appendChild(newLink);ul.appendChild(newLi);</script>'
PROJECT_SUP='<div><button class="button" onclick="showAddTaskModal()">Add Task</button></div><div id="cover"><form id="form" style="display: none"><h1>Create a task that will have a set start date and deadline inside these dates <%= new Date(project.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) %> and <%= new Date(project.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) %> and will have members assigned to theTask</h1><label for="taskName">Task Name:</label><input type="text" id="taskName" name="taskName" required><br><label for="taskDescription">Task Description:</label><input type="text" id="taskDescription" name="taskDescription" required><label for="taskWeight">importance</label><select id="taskWeight" name="taskWeight"><option value="3">High</option><option value="2">Medium</option><option value="1">Low</option></select><br><label for="taskStartDate">Task Start Date:</label><input type="date" id="taskStartDate" name="taskStartDate" required><br><label for="taskEndDate">Task End Date:</label><input type="date" id="taskEndDate" name="taskEndDate" required><br><label for="taskMembers">Task Members:</label><select id="taskMembers" name="taskMembers" required><br><option value="" disabled selected>Select a member</option><% project.members.forEach((member)=> { %><% if (member.level !=="Supervisor" ) { %><option value="<%= member.email %>"><%= member.level %> <%= member.firstName %> <%= member.lastName %></option><% } %><% }) %></select><button type="button" class="button" onclick="addMember()">Add selected member</button><br><list id="memberList"></list><button type="submit" class="button" type="submit">Add Task</button></form><br><button style="display: none" id="close" class="button" onclick="hideAddTaskModal()">Close</button></div>'
PROJECT_DEL='<button class="button" onclick="deleteMem("<%= members.email %>")">Delete</button><script> function deleteMem(users) {const pathname = window.location.pathname;const id = pathname.split("/").pop();console.log(users);fetch(`/delete/${users}/${id}`, {method: "POST",headers: {"Content-Type": "application/json"}}).then(res => res.json()).then(data => {console.log(data);if (data.status === 200) {alert("Member Deleted");window.location.reload();} else if (data.status === 201) {alert("Supervisor was deleted");}}).catch(err => {console.log(err);});}</script>'
```


4. Start the server

npm start

5. Access the application:

http://localhost:3000

# Usage
## Supervisors
Create and manage projects.

Assign tasks and sub-tasks with importance levels.

View and track team progress using weighted progress calculations.

### Delete members:

From the Members page (removes them from the company).

From the Project’s member list (removes them from the project and any tasks/sub-tasks they were assigned).

Delete supervisors via the Admin Page:

Accessed via button on the Home page.

Requires company password for access.

## Members
View assigned projects and tasks.

Manage sub-tasks in a To-Do style list:

Status: Not Started, Started, Done.

Each has an importance level from Low to High.

Contribution to progress is weighted by importance.

Chat with team members and in groups.

Update personal profile and image.

## General
JWT authentication with session cookie support.

Dashboard tailored to role (Supervisor or Member).

RESTful APIs and EJS-rendered views.

Real-time communication.

# Example Routes
/ – Start page

/login – Login

/home – Dashboard

/create – Company creation

/user – User profile

/task – Task and sub-task view

/chat – Chat page

/group_chat – Group chat

/admin – Admin panel (for deleting supervisors, password-protected)

/members – Company members management

/projects/:id/members – Project-specific member management

# Scripts
For Linux/Ubuntu setup:

```bash
sudo apt-get update
sudo apt-get install git-all
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -
sudo apt-get install -y nodejs
git clone https://AdamB64:(githubtoken)@github.com/AdamB64/Project.git
cd Project
npm run install-modules
npm start
```