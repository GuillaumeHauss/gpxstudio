const express = require('express');
const router = express.Router();
const { sequelize, User, Trace, Folder } = require('../models');

// Helper function to get or create a default user
const getDefaultUser = async () => {
  let user = await User.findOne({ where: { username: 'default' } });
  if (!user) {
    user = await User.create({ username: 'default' });
    // Create a default folder for the new user
    await Folder.create({ name: 'default', UserId: user.id, is_default: true });
  }
  return user;
};

// Helper function to get the default folder for a user
const getDefaultFolder = async (userId) => {
  let folder = await Folder.findOne({ where: { UserId: userId, is_default: true } });
  if (!folder) {
    folder = await Folder.create({ name: 'default', UserId: userId, is_default: true });
  }
  return folder;
};

// GET /api/folders - Get all folders and traces for the default user
router.get('/', async (req, res) => {
  try {
    const user = await getDefaultUser();
    const folders = await Folder.findAll({
      where: { UserId: user.id },
      include: [{ model: Trace, order: [['createdAt', 'DESC']] }],
      order: [['createdAt', 'ASC']],
    });
    res.json(folders);
  } catch (error) {
    console.error('Error retrieving folders:', error);
    res.status(500).json({ error: 'Failed to retrieve folders' });
  }
});

// POST /api/folders - Create a new folder
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  try {
    const user = await getDefaultUser();
    const folder = await Folder.create({ name, UserId: user.id });
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// PUT /api/folders/:id - Update a folder's name
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  try {
    const folder = await Folder.findByPk(req.params.id);
    if (folder) {
      if (folder.is_default) {
        return res.status(403).json({ error: 'Cannot rename the default folder' });
      }
      folder.name = name;
      await folder.save();
      res.json(folder);
    } else {
      res.status(404).json({ error: 'Folder not found' });
    }
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// DELETE /api/folders/:id - Delete a folder
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findByPk(req.params.id);
    if (folder) {
      if (folder.is_default) {
        return res.status(403).json({ error: 'Cannot delete the default folder' });
      }

      const user = await getDefaultUser();
      const defaultFolder = await getDefaultFolder(user.id);

      // Move traces to the default folder
      await Trace.update({ FolderId: defaultFolder.id }, { where: { FolderId: folder.id } });

      await folder.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Folder not found' });
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

module.exports = router;
