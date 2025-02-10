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
- [License](#license)

## Overview

This application serves as a platform for project management, offering functionality for supervisors and members to manage their projects and collaborate effectively.

## Features

- User authentication using JWT and session-based tokens.
- Role-based access control for supervisors and members.
- Project creation, management, and task assignment.
- Profile management, including image uploads.
- Dynamic dashboards for project and user monitoring.

## Technologies

- **Frontend:** EJS templates, CSS, JavaScript.
- **Backend:** Node.js, Express.js, MongoDB.
- **Authentication:** JWT, bcrypt.
- **Utilities:** CORS, session-based cookies, RESTful API.

## File Structure

- **CSS/** - Stylesheets
- **images/** - Image assets
- **js/** - Frontend JavaScript files
  - create.js
  - home.js
  - index.js
  - login.js
  - Project.js
  - users.js
- **mongo/** - MongoDB schema files
- **node_modules/** - Dependencies
- **view/** - EJS templates
  - about.ejs
  - chat.ejs
  - create.ejs
  - header.ejs
  - home.ejs
  - invite.ejs
  - login.ejs
  - Members.ejs
  - settings.ejs
  - sproject.ejs
  - start.ejs
  - user.ejs
- **.env** - Environment variables
- **.gitignore** - Git ignore file
- **Design.docx** - Design document
- **development.docx** - Development document
- **server.js** - Main server file
- **start.sh** - Script for setting up the environment

## Installation

### Prerequisites

- Node.js 21.x or higher
- MongoDB
- Git

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/AdamB64/Project.git
   cd Project

2. install dependencies:
    npm ci

3. Configure environment variables: Create a .env file in the root directory with the following:
    secret=YOUR_SESSION_SECRET
    JWT_SECRET=YOUR_JWT_SECRET
    MEM_ROLE=YOUR_MEMBER_ROLE
    SUB_ROLE=YOUR_SUPERVISOR_ROLE

4. start the server
    npm start

5. acess the application:
    localhost:3000

## Usage

The application supports the following functionalities:

Supervisors:
Create projects.
Invite members to their company.
Manage members and track project progress.

Members:
View assigned projects.
Manage tasks and update progress.

General:
Secure login using JWT authentication.
Profile management with optional image uploads.

Example Routes in server.js:
/ - Renders the start page.
/login - User login page.
/home - Dashboard for authenticated users.
/create - Project creation page for supervisors.
/user - Displays user-specific data.

## script:
sudo apt-get update
sudo apt-get install git-all
node --version
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash 
sudo apt-get install -y nodejs
git clone https://AdamB64:(githubtoken)@github.com/AdamB64/Project.git
ls
cd Project
npm ci
npm start
