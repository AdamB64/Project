# Project Name

A web-based project management system that allows users to create, manage, and track projects and user activities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies](#technologies)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Overview

This application serves as a platform for project management, offering functionality for supervisors and members to manage their projects and collaborate effectively.

## Features

- User authentication (JWT and session-based).
- Role-based access for supervisors and members.
- Project creation and management.
- Profile management with image uploads.
- Interactive user and project dashboard.

## Technologies

- **Frontend:** EJS templates, CSS, JavaScript.
- **Backend:** Node.js, Express.js, MongoDB.
- **Authentication:** JWT, bcrypt.
- **Miscellaneous:** Cookie-based sessions, CORS, RESTful API design.

## File Structure

├── CSS/ # Stylesheets ├── images/ # Image assets ├── js/ # Frontend JavaScript files │ ├── create.js │ ├── home.js │ ├── index.js │ ├── login.js │ ├── Project.js │ └── users.js ├── mongo/ # MongoDB schema files ├── node_modules/ # Dependencies ├── view/ # EJS templates │ ├── about.ejs │ ├── chat.ejs │ ├── create.ejs │ ├── header.ejs │ ├── home.ejs │ ├── invite.ejs │ ├── login.ejs │ ├── Members.ejs │ ├── settings.ejs │ ├── sproject.ejs │ ├── start.ejs │ └── user.ejs ├── .env # Environment variables ├── .gitignore # Git ignore file ├── Design.docx # Design document ├── development.docx # Development document ├── server.js # Main server file ├── start.sh # Script for setting up the environment


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

This project includes multiple features for supervisors and members:

Supervisors: Create projects, invite members, and manage users.
Members: View assigned projects and manage tasks.
Authentication: Secure login using JWT tokens.
