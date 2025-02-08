const mongoose = require('./mongo.js');

// Define the Company schema
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, required: true },
    companyEmail: { type: String, required: true },
    members: [
        {
            level: { type: String, required: true, },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
        }
    ]
});


// Create the model
const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
