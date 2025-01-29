const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const Company = require('./mongo/company.js');

app.use(express.json());
// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));  // Make sure this matches your actual directory name

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'CSS')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// Routes
app.get('/', (req, res) => {
    res.render('start');  // Changed from 'view' to 'start'
});

app.get('/about', (req, res) => {
    res.render('about');  // Changed from 'view' to 'about'
});  // Add your about route here

app.get('/settings', (req, res) => {
    res.render('settings');  // Changed from 'view' to 'settings'
});  // Add your settings route here

app.get('/user', (req, res) => {
    res.render('user');  // Changed from 'view' to 'user'
});  // Add your user route here


app.get('/create', (req, res) => {
    res.render('create');  // Changed from 'view' to 'create'
});  // Add your create route here

app.get('/login', (req, res) => {
    res.render('login');  // Changed from 'view' to 'login'
});  // Add your login route here

app.get('/home', (req, res) => {
    res.render('home');  // Changed from 'view' to 'home'
});  // Add your home route here


// Add your routes here
app.post('/add-company', async (req, res) => {
    try {
        // Log the incoming request body for verification
        //console.log('Incoming Request Body:', req.body);

        const { company, supervisors, members } = req.body;

        // Explicitly map the fields to ensure correct structure
        const newCompany = new Company({
            name: company.name,
            address: company.address,
            email: company.email,
            industry: company.industry,
            supervisors,
            members,
        });

        await newCompany.save();

        res.status(201).send({ message: 'Company data added successfully', newCompany });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send({ message: 'An error occurred while saving the data', error });
    }
});


// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
