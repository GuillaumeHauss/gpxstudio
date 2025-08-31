const express = require('express');
const router = express.Router();
const { sequelize, User, Trace, Track, Segment, Point, Waypoint } = require('../models');

// Helper function to get or create a default user
const getDefaultUser = async () => {
  let user = await User.findOne({ where: { username: 'default' } });
  if (!user) {
    user = await User.create({ username: 'default' });
  }
  return user;
};

// POST /api/traces - Create a new trace
router.post('/', async (req, res) => {
  const { name, tracks, waypoints } = req.body;
  if (!name || !tracks) {
    return res.status(400).json({ error: 'Missing required fields: name and tracks' });
  }

  const t = await sequelize.transaction();
  try {
    const user = await getDefaultUser();

    const trace = await Trace.create({ name, UserId: user.id }, { transaction: t });

    for (const trackData of tracks) {
      const track = await Track.create({ name: trackData.name, TraceId: trace.id }, { transaction: t });

      for (const segmentData of trackData.segments) {
        const segment = await Segment.create({ TrackId: track.id }, { transaction: t });

        for (const [index, pointData] of segmentData.points.entries()) {
          await Point.create({
            ...pointData,
            SegmentId: segment.id,
            order: index,
          }, { transaction: t });
        }
      }
    }

    if (waypoints) {
      for (const waypointData of waypoints) {
        await Waypoint.create({
          ...waypointData,
          TraceId: trace.id,
        }, { transaction: t });
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
            await trace.destroy(); // onDelete: 'CASCADE' will handle the rest
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
    const { name, tracks, waypoints } = req.body;
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
        // Segments and Points are deleted via CASCADE

        // Update trace name
        trace.name = name;
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
