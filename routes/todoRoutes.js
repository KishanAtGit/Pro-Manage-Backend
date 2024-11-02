const express = require('express');
const todoRoutes = express();
const Todo = require('../models/todo');

todoRoutes.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const analytics = req.query.analytics === 'true';
    const today = req.query.filter === 'today';
    const thisWeek = req.query.filter === 'thisWeek';
    const thisMonth = req.query.filter === 'thisMonth';

    // Find todos where the user is either the creator or an accessor or if assigned to the user
    let todosData = await Todo.find({
      $or: [
        { createdBy: userId },
        { 'assignedTo.userId': userId },
        { accessors: { $elemMatch: { accessorId: userId } } },
      ],
    });

    // Filter based on the query
    const now = new Date();
    if (today) {
      todosData = todosData.filter(todo => {
        const dueDate = new Date(todo.dueDate);
        return dueDate.toDateString() === now.toDateString();
      });
    } else if (thisWeek) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Set to the first day of the week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to the last day of the week (Saturday)

      todosData = todosData.filter(todo => {
        const dueDate = new Date(todo.dueDate);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      });
    } else if (thisMonth) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the current month

      todosData = todosData.filter(todo => {
        const dueDate = new Date(todo.dueDate);
        return dueDate >= startOfMonth && dueDate <= endOfMonth;
      });
    }

    // Categorize todos
    const backlog = todosData.filter(todo => todo.status === 'backlog');
    const todos = todosData.filter(todo => todo.status === 'todo');
    const inProgress = todosData.filter(todo => todo.status === 'in-Progress');
    const done = todosData.filter(todo => todo.status === 'done');

    if (analytics) {
      // Count the number of todos by priority
      const priorityCounts = {
        low: todosData.filter(todo => todo.priority === 'low').length,
        moderate: todosData.filter(todo => todo.priority === 'moderate').length,
        high: todosData.filter(todo => todo.priority === 'high').length,
      };

      // Count the number of todos by due date (e.g., for upcoming deadlines)
      const dueDateCount = todosData.filter(todo => todo.dueDate).length;

      res.status(200).json({
        backlog,
        todos,
        inProgress,
        done,
        analytics: {
          priorityCounts,
          dueDateCount,
        },
      });
    } else {
      res.status(200).json({
        backlog,
        todos,
        inProgress,
        done,
      });
    }
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
