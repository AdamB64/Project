const mongoose = require('./mongo.js');

// Define the Company schema
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    industry: { type: String, required: true },
    supervisors: [
        {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            role: { type: String, required: true },
            password: { type: String, required: true }
        }
    ],
    members: [
        {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            role: { type: String, required: true },
            password: { type: String, required: true }
        }
    ]
});

// Create the model
const Company = mongoose.model('Company', companySchema);

module.exports = Company;
