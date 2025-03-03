const mongoose = require('./mongo.js');

const sub_taskSchema = new mongoose.Schema({
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
        profile: { type: String, required: true },
        id: { type: String, required: true },
    }]
});

const Sub_Task = mongoose.model('Sub_Task', sub_taskSchema);

module.exports = Sub_Task;