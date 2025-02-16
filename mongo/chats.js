const mongoose = require('./mongo.js');

const chatSchema = new mongoose.Schema({
    users: [{
        id: { type: String, required: true },
    }],
    input: [
        {
            profile: { type: String, required: true },
            sender: { type: String, required: true },
            message: { type: String, required: true },
            timestamp: { type: String, required: true },
            file: { type: [String], required: false },
            date: { type: String, required: true }
        }
    ]
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;