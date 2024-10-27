const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new Schema({
  title: String,
  priority: String,
  assignedTo: String,
  checklist: [
    {
      description: String,
      checked: Boolean,
    },
  ],
  dueDate: String,
  status: String,
  accessors: [{ accessorId: String }],
  createdBy: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('Todo', todoSchema);
