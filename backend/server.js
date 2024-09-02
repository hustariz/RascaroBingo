const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
    });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/users', (req, res, next) => {
    console.log('Request received on /api/users');
    console.log(`Unmatched route: ${req.method} ${req.url}`);
    next();
  }, require('./routes/users'));

app.use('/users', require('./routes/users'));


app.get('/', (req, res) => {
    res.send('Server is running');
  });

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));