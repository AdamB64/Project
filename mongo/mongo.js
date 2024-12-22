require('dotenv').config();
const mongoose = require('mongoose');

console.log(process.env.MONGO_URL);

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Could not connect to MongoDB', err);
        process.exit(1); // Exit the process with an error
    }
}

connectToDatabase();

module.exports = mongoose;
