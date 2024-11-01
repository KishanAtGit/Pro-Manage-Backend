const express = require('express');
const todoRoutes = express();
const Todo = require('../models/todo');

todoRoutes.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find todos where the user is either the creator or an accessor or if assigned to the user
    const todosData = await Todo.find({
      $or: [
        { createdBy: userId },
        { 'assignedTo.userId': userId },
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
    const { title, priority, checklist, assignedTo, dueDate, createdBy } =
      req.body;

    const newTodo = new Todo({
      title,
      priority,
      assignedTo,
      checklist,
      dueDate,
      status: 'todo',
      createdBy,
    });
    await newTodo.save();
    res.status(201).json({ message: 'Todo created successfully!' });
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
    res.status(200).send({ message: 'Todo status updated successfully' });
  } catch (error) {
    next(error);
  }
});

todoRoutes.patch('/updateChecklist', async (req, res, next) => {
  try {
    const { todoId, checklistId } = req.body;
    const todo = await Todo.findById(todoId);
    const checklist = todo.checklist.find(item => item.id === checklistId);
    checklist.checked = !checklist.checked;
    await todo.save();
    res.status(200).send({ message: 'Checklist updated successfully' });
  } catch (error) {
    next(error);
  }
});

todoRoutes.patch('/updateTodo', async (req, res, next) => {
  try {
    const { todoId, title, priority, assignedTo, checklist, dueDate } =
      req.body;
    const todo = await Todo.findById(todoId);
    todo.title = title;
    todo.priority = priority;
    todo.assignedTo = assignedTo;
    todo.checklist = checklist;
    todo.dueDate = dueDate;
    await todo.save();
    res.status(200).send({ message: 'Todo updated successfully' });
  } catch (error) {
    next(error);
  }
});

todoRoutes.delete('/deleteTodo', async (req, res, next) => {
  try {
    const { todoId } = req.body;
    await Todo.findByIdAndDelete(todoId);
    res.status(200).send({ message: 'Todo deleted successfully' });
  } catch (error) {
    next(error);
  }
});

todoRoutes.patch('/addAccessor/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { accessorId } = req.body;

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
