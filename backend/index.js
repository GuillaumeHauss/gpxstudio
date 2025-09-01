const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const tracesRouter = require('./routes/traces');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
console.log('CORS okay');
app.use(express.json({ limit: '50mb' })); // Increase payload size limit
console.log('express limit okay');

// API Routes
app.use('/api/traces', tracesRouter);
const foldersRouter = require('./routes/folders');
app.use('/api/folders', foldersRouter);
console.log('api traces okay');

app.get('/', (req, res) => {
  res.send('Hello from the gpx.studio backend!');
});

// Database synchronization
sequelize.sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Unable to synchronize the database:', err);
  });
