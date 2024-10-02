const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String
    },
    content: {
        type: String
    },
    summary: {
        type: String
    },
    cover: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;
