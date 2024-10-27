const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todoRoutes');
const authenticator = require('./middleware/authenticator');

const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//routes
app.use('/api/auth', authRoutes);
app.use('/api/todo', authenticator, todoRoutes);

//error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong!');
});

//server
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
  db()
    .then(() => console.log('Connected to DB'))
    .catch(err => console.log(err));
});
