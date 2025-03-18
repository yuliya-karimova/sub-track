const app = require('./app'); // Теперь сервер подключает `app.js`
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
