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

Project/ ├── CSS/ │ ├── about.css │ ├── admin.css │ ├── Chat.css │ ├── Chats.css │ ├── create.css │ ├── GChats.css │ ├── GInvite.css │ ├── Header.css │ ├── home.css │ ├── Invite.css │ ├── login.css │ ├── Members.css │ ├── PMembers.css │ ├── profile.css │ ├── project.css │ ├── projects.css │ ├── SProject.css │ ├── start.css │ ├── task.css │ └── users.css ├── images/ │ └── icon.png ├── js/ │ ├── chat.js │ ├── chats.js │ ├── create.js │ ├── GChat.js │ ├── GInvite.js │ ├── home.js │ ├── index.js │ ├── invite.js │ ├── login.js │ ├── project.js │ ├── SProject.js │ ├── task.js │ └── users.js ├── mongo/ │ ├── chats.js │ ├── company.js │ ├── group_chats.js │ ├── mongo.js │ ├── project.js │ ├── sub_task.js │ └── task.js ├── view/ │ ├── about.ejs │ ├── admin.ejs │ ├── chat.ejs │ ├── chats.ejs │ ├── create.ejs │ ├── GInvite.ejs │ ├── group_chat.ejs │ ├── header.ejs │ ├── home.ejs │ ├── Invite.ejs │ ├── login.ejs │ ├── member.ejs │ ├── Members.ejs │ ├── profile.ejs │ ├── project.ejs │ ├── projects.ejs │ ├── sproject.ejs │ ├── start.ejs │ ├── task.ejs │ └── user.ejs ├── .env ├── .gitignore ├── Design.docx ├── development.docx ├── package.json ├── package-lock.json ├── server.js └── start.sh


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

Create a .env file in the root directory and add:
secret=YOUR_SESSION_SECRET
JWT_SECRET=YOUR_JWT_SECRET
MEM_ROLE=YOUR_MEMBER_ROLE
SUB_ROLE=YOUR_SUPERVISOR_ROLE

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