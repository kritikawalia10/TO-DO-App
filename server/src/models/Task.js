const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({ title: String, completed: { type: Boolean, default: false } });

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    dueDate: Date,
    tags: [String],
    subtasks: [subtaskSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    timeSpent: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
