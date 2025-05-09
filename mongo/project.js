const mongoose = require('./mongo.js');

// Define the Company schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  progress: { type: Number, required: true, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  companyEmail: { type: String, required: true },
  members: [
    {
      level: { type: String, required: true, },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, },
      profile: { type: String, required: true },
    }
  ]
},
{ timestamps: true }); // Enables createdAt & updatedAt fields automatically););


// Create the model
const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
