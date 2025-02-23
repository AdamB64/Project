const mongoose = require('./mongo.js');

const groupChatSchema = new mongoose.Schema({
    name: { type: String, required: true },
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
            profile: { type: String, required: true },
            sender: { type: String, required: true },
            message: { type: String, required: true },
            timestamp: { type: String, required: true },
            file: { type: [String], required: false },
            date: { type: String, required: true }
        }
    ]
});

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = GroupChat;