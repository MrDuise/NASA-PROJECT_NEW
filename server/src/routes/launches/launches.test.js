const request = require('supertest');
const app = require('../../app');
const { loadPlanetsData } = require('../../models/planets.model');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');

describe('Launches API', () => {

  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  })

  afterAll(async () => {
    await mongoDisconnect();
  })

  describe('Test GET /launches', () => {
    test('should return all launches', async () => {
      const response = await request(app)
        .get('/v1/launches')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });

  describe('Test POST /launches', () => {
    const completeLaunchData = {
      mission: 'Uss Enterprize',
      rocket: 'NCC 1701-D',
      target: 'Kepler-62 f',
      launchDate: 'January 4, 2028',
    };

    const launchDataWithoutDate = {
      mission: 'Uss Enterprize',
      rocket: 'NCC 1701-D',
      target: 'Kepler-62 f',
    };

    const launchDataWithInvalidDate = {
      mission: 'Uss Enterprize',
      rocket: 'NCC 1701-D',
      target: 'Kepler-62 f',
      launchDate: 'zoot',
    };

    test('should create a new launch', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchData)
        .expect('Content-Type', /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });
    test('It should catch missing fields', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithoutDate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: 'Bad Request',
        message: 'Mission, rocket, launchDate and target are required',
      });
    });

    test('It should catch invalid dates', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithInvalidDate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: 'Bad Request',
        message: 'Invalid launchDate',
      });
    });
  });

  describe('Test DELETE /launches:id', () => {
    const abortedLaunch = {
      flightNumber: 100,
      mission: 'Kepler Exoplanet Survey',
      rocket: 'Explorer IS1',
      launchDate: new Date('December 27, 2030'),
      target: 'Kepler-62 b',
      customer: ['ZTM', 'NASA'],
      upcoming: false,
      success: false,
    };
    test('should abort a launch', async () => {
      const response = await request(app)
        .delete('/v1/launches/100')
        .expect('Content-Type', /json/)
        .expect(200);

        console.log(response.body);
      const requestDate = new Date(abortedLaunch.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(response.body).toMatchObject({message: 'Launch aborted'});

      
    });
  });

  describe('Test GET /planets', () => {
    test('should return all planets', async () => {
      const response = await request(app)
        .get('/v1/planets')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });
});
