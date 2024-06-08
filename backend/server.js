const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoUri = 'mongodb://127.0.0.1:27017/bookhub';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Book schema
const bookSchema = new mongoose.Schema({
  id: String,
  author_name: String,
  cover_pic: String,
  about_book: String,
  rating: Number,
  read_status: String,
  title: String,
  about_author: String,
});

const Book = mongoose.model('Book', bookSchema);

// Add book endpoint
app.post('/api/books', async (req, res) => {
  const { book_details } = req.body;
  try {
    const newBook = new Book(book_details);
    await newBook.save();
    res.status(201).json({ message: 'Book added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch books
app.get('/api/books', async (req, res) => {
  try {
    const { shelf, search } = req.query;
    let query = {};
    if (shelf && shelf === 'READING') {
      query.read_status = { $in: ['CURRENTLY_READING', 'WANT_TO_READ'] };
    }
    if (search) {
      query.title = { $regex: new RegExp(search, 'i') };
    }
    const books = await Book.find(query);
    res.json({ books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch top-rated books
app.get('/api/top-rated-books', async (req, res) => {
  try {
    const topRatedBooks = await Book.find();
    res.json({ books: topRatedBooks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get book details by ID
app.get('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid book ID format' });
  }
  try {
    const book = await Book.findOne({ id });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ book_details: book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to validate UUID
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
