const express = require('express');
const router = express.Router();
const { sequelize, User, Trace, Track, Segment, Point, Waypoint, Folder } = require('../models');

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

// POST /api/traces - Create a new trace
router.post('/', async (req, res) => {
  const { name, tracks, waypoints, folderId } = req.body;
  if (!name || !tracks) {
    return res.status(400).json({ error: 'Missing required fields: name and tracks' });
  }

  const t = await sequelize.transaction();
  try {
    const user = await getDefaultUser();
    let targetFolderId = folderId;
    if (!targetFolderId) {
      const defaultFolder = await getDefaultFolder(user.id);
      targetFolderId = defaultFolder.id;
    }

    const existingTrace = await Trace.findOne({ where: { name, FolderId: targetFolderId } });
    if (existingTrace) {
      await t.rollback();
      return res.status(409).json({ error: `A trace with the name "${name}" already exists in this folder.` });
    }

    const trace = await Trace.create({ name, UserId: user.id, FolderId: targetFolderId }, { transaction: t });

    for (const trackData of tracks) {
      const track = await Track.create({ name: trackData.name, TraceId: trace.id }, { transaction: t });
      for (const segmentData of trackData.segments) {
        const segment = await Segment.create({ TrackId: track.id }, { transaction: t });
        for (const [index, pointData] of segmentData.points.entries()) {
          await Point.create({ ...pointData, SegmentId: segment.id, order: index }, { transaction: t });
        }
      }
    }

    if (waypoints) {
      for (const waypointData of waypoints) {
        await Waypoint.create({ ...waypointData, TraceId: trace.id }, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json(trace);
  } catch (error) {
    await t.rollback();
    console.error('Error creating trace:', error);
    res.status(500).json({ error: 'Failed to create trace' });
  }
});

// GET /api/traces - Get all traces
router.get('/', async (req, res) => {
  try {
    const user = await getDefaultUser();
    const traces = await Trace.findAll({
      where: { UserId: user.id },
      include: [Folder],
      order: [['createdAt', 'DESC']],
    });
    res.json(traces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve traces' });
  }
});

// GET /api/traces/:id - Get a single trace
router.get('/:id', async (req, res) => {
  try {
    const trace = await Trace.findByPk(req.params.id, {
      include: [
        {
          model: Track,
          include: [
            {
              model: Segment,
              include: [
                {
                  model: Point,
                  order: [['order', 'ASC']],
                },
              ],
            },
          ],
        },
        { model: Waypoint },
        { model: Folder },
      ],
    });

    if (trace) {
      res.json(trace);
    } else {
      res.status(404).json({ error: 'Trace not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve trace' });
  }
});

// DELETE /api/traces/:id - Delete a trace
router.delete('/:id', async (req, res) => {
  try {
    const trace = await Trace.findByPk(req.params.id);
    if (trace) {
      await trace.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Trace not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trace' });
  }
});

// PUT /api/traces/:id - Update a trace
router.put('/:id', async (req, res) => {
  const { name, tracks, waypoints, folderId } = req.body;
  if (!name || !tracks) {
    return res.status(400).json({ error: 'Missing required fields: name and tracks' });
  }

  const t = await sequelize.transaction();
  try {
    const trace = await Trace.findByPk(req.params.id);
    if (!trace) {
      await t.rollback();
      return res.status(404).json({ error: 'Trace not found' });
    }

    // Delete old data
    await Track.destroy({ where: { TraceId: trace.id }, transaction: t });
    await Waypoint.destroy({ where: { TraceId: trace.id }, transaction: t });

    // Check for name collision before updating
    if (name !== trace.name || (folderId && folderId !== trace.FolderId)) {
      const existingTrace = await Trace.findOne({
        where: {
          name,
          FolderId: folderId || trace.FolderId,
          id: { [sequelize.Op.ne]: trace.id } // Exclude the current trace
        }
      });
      if (existingTrace) {
        await t.rollback();
        return res.status(409).json({ error: `A trace with the name "${name}" already exists in this folder.` });
      }
    }

    // Update trace name and folder
    trace.name = name;
    if (folderId) {
      trace.FolderId = folderId;
    }
    await trace.save({ transaction: t });

    // Create new data
    for (const trackData of tracks) {
      const track = await Track.create({ name: trackData.name, TraceId: trace.id }, { transaction: t });
      for (const segmentData of trackData.segments) {
        const segment = await Segment.create({ TrackId: track.id }, { transaction: t });
        for (const [index, pointData] of segmentData.points.entries()) {
          await Point.create({ ...pointData, SegmentId: segment.id, order: index }, { transaction: t });
        }
      }
    }
    if (waypoints) {
      for (const waypointData of waypoints) {
        await Waypoint.create({ ...waypointData, TraceId: trace.id }, { transaction: t });
      }
    }

    await t.commit();
    res.json(trace);
  } catch (error) {
    await t.rollback();
    console.error('Error updating trace:', error);
    res.status(500).json({ error: 'Failed to update trace' });
  }
});

module.exports = router;
