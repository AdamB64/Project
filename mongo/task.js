const mongoose = require('./mongo.js');

const taskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  description: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  projectID: { type: String, required: true },
  compantEmail: { type: String, required: true },
  progress: { type: String, required: true, default: "0" },
  importance: { type: Number, required: true, default: 1 },
  members: [{
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    level: { type: String, required: true },
    id: { type: String, required: true },
  }]
},
{ timestamps: true }); // Enables createdAt & updatedAt fields automatically);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;