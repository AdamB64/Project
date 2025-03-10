const mongoose = require('./mongo.js');

const taskSchema = new mongoose.Schema({
    task: { type: String, required: true },
    description: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    projectID: { type: String, required: true },
    compantEmail: { type: String, required: true },
    progress: { type: String, required: true, default: "0" },
    members: [{
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        level: { type: String, required: true },
        id: { type: String, required: true },
    }]
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;