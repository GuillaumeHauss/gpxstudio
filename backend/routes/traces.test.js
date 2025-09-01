const request = require('supertest');
const express = require('express');
const tracesRouter = require('./traces');
const { sequelize } = require('../models');

// Set up a test application
const app = express();
app.use(express.json());
app.use('/api/traces', tracesRouter);

// Mock trace data for testing
const mockTraceData = {
  name: 'Test Trace',
  tracks: [
    {
      name: 'Test Track 1',
      segments: [
        {
          points: [
            { lat: 40.7128, lng: -74.0060, ele: 10, time: new Date().toISOString() },
            { lat: 40.7138, lng: -74.0070, ele: 12, time: new Date().toISOString() },
          ],
        },
      ],
    },
  ],
  waypoints: [
    { lat: 40.7128, lng: -74.0060, name: 'Start Point' },
  ],
};


describe('Traces API', () => {
  beforeEach(async () => {
    // Sync all models before each test
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close the database connection after all tests
    await sequelize.close();
  });

  describe('POST /api/traces', () => {
    it('should create a new trace and return it', async () => {
      const res = await request(app)
        .post('/api/traces')
        .send(mockTraceData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(mockTraceData.name);
    });

    it('should fail with 400 if name is missing', async () => {
      const { name, ...invalidData } = mockTraceData;
      const res = await request(app)
        .post('/api/traces')
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/traces', () => {
    it('should return an empty array when no traces exist', async () => {
      const res = await request(app).get('/api/traces');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should return an array with one trace after creating one', async () => {
      await request(app).post('/api/traces').send(mockTraceData);
      const res = await request(app).get('/api/traces');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe(mockTraceData.name);
    });
  });

  describe('GET /api/traces/:id', () => {
    it('should return a single trace with all its data', async () => {
      const postRes = await request(app).post('/api/traces').send(mockTraceData);
      const traceId = postRes.body.id;

      const getRes = await request(app).get(`/api/traces/${traceId}`);

      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.id).toBe(traceId);
      expect(getRes.body.name).toBe(mockTraceData.name);
      expect(getRes.body.Tracks).toHaveLength(1);
      expect(getRes.body.Tracks[0].Segments).toHaveLength(1);
      expect(getRes.body.Tracks[0].Segments[0].Points).toHaveLength(2);
      expect(getRes.body.Waypoints).toHaveLength(1);
    });

    it('should return 404 for a non-existent trace', async () => {
      const res = await request(app).get('/api/traces/999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('DELETE /api/traces/:id', () => {
    it('should delete a trace and return 204', async () => {
      const postRes = await request(app).post('/api/traces').send(mockTraceData);
      const traceId = postRes.body.id;

      const deleteRes = await request(app).delete(`/api/traces/${traceId}`);
      expect(deleteRes.statusCode).toEqual(204);

      const getRes = await request(app).get(`/api/traces/${traceId}`);
      expect(getRes.statusCode).toEqual(404);
    });

    it('should return 404 when trying to delete a non-existent trace', async () => {
        const res = await request(app).delete('/api/traces/999');
        expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/traces/:id', () => {
    it('should update a trace and return the updated trace', async () => {
        const postRes = await request(app).post('/api/traces').send(mockTraceData);
        const traceId = postRes.body.id;

        const updatedData = { ...mockTraceData, name: 'Updated Test Trace' };

        const putRes = await request(app)
            .put(`/api/traces/${traceId}`)
            .send(updatedData);

        expect(putRes.statusCode).toEqual(200);
        expect(putRes.body.name).toBe('Updated Test Trace');

        const getRes = await request(app).get(`/api/traces/${traceId}`);
        expect(getRes.body.name).toBe('Updated Test Trace');
    });

    it('should return 404 for a non-existent trace', async () => {
        const res = await request(app)
            .put('/api/traces/999')
            .send(mockTraceData);
        expect(res.statusCode).toEqual(404);
    });
  });
});
