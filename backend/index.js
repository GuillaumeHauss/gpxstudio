const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const tracesRouter = require('./routes/traces');
const foldersRouter = require('./routes/folders');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload size limit

// API Routes
app.use('/api/traces', tracesRouter);
app.use('/api/folders', foldersRouter);

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
