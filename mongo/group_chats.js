const mongoose = require('./mongo.js');

const groupChatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    members: [
        {
            level: { type: String, required: true },
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true }
        }
    ],
    input: [
        {
            profile: { type: String },
            sender: { type: String },
            message: { type: String },
            timestamp: { type: String },
            file: { type: [String] },
            date: { type: String }
        }
    ]
});

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = GroupChat;