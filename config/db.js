const mongoose = require('mongoose');

// MongoDB connection URI
const mongoURI = 'mongodb://localhost:27017/my_database'; // Replace 'my_database' with your database name

// Async function to connect to MongoDB
const connectToDb = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,     // Use the new URL parser
      useUnifiedTopology: true, // Use the unified topology layer for connection management
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the application if the database connection fails
  }
};

module.exports = connectToDb;

