const mongoose = require('./mongo.js');

// Define the Company schema
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    industry: { type: String, required: true },
    supervisors: [
        {
            level: { type: String, required: true, default: 'Supervisor' },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            role: { type: String, required: true },
            password: { type: String, required: true },
            profile: { type: String, required: true }
        }
    ],
    members: [
        {
            level: { type: String, required: true, default: 'Member' },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            role: { type: String, required: true },
            password: { type: String, required: true },
            profile: { type: String, required: true }
        }
    ]
},
    { timestamps: true }); // Enables createdAt & updatedAt fields automatically););

// Create the model
const Company = mongoose.model('Company', companySchema);

module.exports = Company;
