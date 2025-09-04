const request = require('supertest');
const express = require('express');
const { sequelize, User, Trace, Folder } = require('../models');
const foldersRouter = require('./folders');
const app = express();
app.use(express.json());
app.use('/api/folders', foldersRouter);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('Folders API', () => {

  it('should create a new folder', async () => {
    const res = await request(app)
      .post('/api/folders')
      .send({ name: 'My Test Folder' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', 'My Test Folder');
  });

  it('should get all folders', async () => {
    const res = await request(app).get('/api/folders');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should update a folder', async () => {
    const folder = await Folder.create({ name: 'Folder to update' });
    const res = await request(app)
      .put(`/api/folders/${folder.id}`)
      .send({ name: 'Updated Folder Name' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'Updated Folder Name');
  });

  it('should delete a folder', async () => {
    const folder = await Folder.create({ name: 'Folder to delete' });
    const res = await request(app).delete(`/api/folders/${folder.id}`);
    expect(res.statusCode).toEqual(204);
  });

  it('should not rename the default folder', async () => {
    const user = await User.findOne({ where: { username: 'default' } });
    const defaultFolder = await Folder.findOne({ where: { UserId: user.id, is_default: true } });
    const res = await request(app)
      .put(`/api/folders/${defaultFolder.id}`)
      .send({ name: 'New Default Name' });
    expect(res.statusCode).toEqual(403);
  });

  it('should not delete the default folder', async () => {
    const user = await User.findOne({ where: { username: 'default' } });
    const defaultFolder = await Folder.findOne({ where: { UserId: user.id, is_default: true } });
    const res = await request(app).delete(`/api/folders/${defaultFolder.id}`);
    expect(res.statusCode).toEqual(403);
  });

});
