const mongoose = require('./mongo.js');

const projectChatSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    projectId: { type: String, required: true },
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
            firstName: { type: String },
            lastName: { type: String },
            Userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            message: { type: String },
            timestamp: { type: String },
            file: { type: [String] },
            date: { type: String }
        }
    ]
},
    { timestamps: true }); // Enables createdAt & updatedAt fields automatically););

const ProjectChat = mongoose.model('ProjectChat', projectChatSchema);

module.exports = ProjectChat;