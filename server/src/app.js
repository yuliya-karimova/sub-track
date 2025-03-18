const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/subscriptions', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Маршруты
app.use('/api/subscriptions', subscriptionRoutes);

module.exports = app; // Теперь тесты могут использовать этот файл
