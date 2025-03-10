const mongoose = require('./mongo.js');

const sub_taskSchema = new mongoose.Schema({
    task: { type: String, required: true },
    description: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    TaskID: { type: String, required: true },
    companyEmail: { type: String, required: true },
    todo: { type: String, required: true, default: "Not Started" },
    members: [{
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        level: { type: String, required: true },
        id: { type: String, required: true },
    }]
});

const Sub_Task = mongoose.model('Sub_Task', sub_taskSchema);

module.exports = Sub_Task;