const express = require('express');
const todoRoutes = express();
const Todo = require('../models/todo');

todoRoutes.get('/getTodos', async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Find todos where the user is either the creator or an accessor
    const todosData = await Todo.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId },
        { accessors: { $elemMatch: { accessorId: userId } } },
      ],
    });

    // categories todos
    const backlog = todosData.filter(todo => todo.status === 'backlog');
    const todos = todosData.filter(todo => todo.status === 'todo');
    const inProgress = todosData.filter(todo => todo.status === 'in-Progress');
    const done = todosData.filter(todo => todo.status === 'done');

    res.status(200).json({
      backlog,
      todos,
      inProgress,
      done,
    });
  } catch (error) {
    next(error);
  }
});

todoRoutes.post('/createTodo', async (req, res, next) => {
  try {
    const {
      title,
      priority,
      assignedTo,
      checklist,
      dueDate,
      status,
      createdBy,
    } = req.body;
    const newTodo = new Todo({
      title,
      priority,
      assignedTo,
      checklist,
      dueDate,
      status,
      createdBy,
    });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    next(error);
  }
});

todoRoutes.patch('/updateTodoStatus', async (req, res, next) => {
  try {
    const { todoId, status } = req.body;
    const todo = await Todo.findById(todoId);
    todo.status = status;
    await todo.save();
    res.status(200);
  } catch (error) {
    next(error);
  }
});

todoRoutes.patch('/addAccessor', async (req, res, next) => {
  try {
    const { userId, accessorId } = req.body;

    // Find todos where the user is either the creator or an accessor
    const todos = await Todo.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId },
        { accessors: { $elemMatch: { accessorId: userId } } },
      ],
    });

    for (const todo of todos) {
      // Check if the accessorId already exists in accessors array
      const isAlreadyAccessor = todo.accessors.some(
        accessor => accessor.accessorId === accessorId
      );

      if (!isAlreadyAccessor) {
        // Add new accessorId if not already present
        todo.accessors.push({ accessorId });
        await todo.save();
      }
    }

    res.status(200);
  } catch (error) {
    next(error);
  }
});

module.exports = todoRoutes;