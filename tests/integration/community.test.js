const request = require('supertest');
const app = require('../../src/app');
const { User, SustainabilityPost, Comment } = require('../../src/models');

describe('Community Features API', () => {
  let authToken;
  let userId;
  let postId;

  beforeAll(async () => {
    const user = await User.create({
      email: 'community@example.com',
      password: 'password123'
    });
    userId = user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'community@example.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;
  });

  test('Create a sustainability post', async () => {
    const res = await request(app)
      .post('/api/community')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'My Eco Journey',
        content: "I've started composting at home!",
        type: 'achievement',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', 'My Eco Journey');
    expect(res.body).toHaveProperty('type', 'achievement');
    postId = res.body.id;
  });

  test('Get community posts', async () => {
    const res = await request(app)
      .get('/api/community');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title', 'My Eco Journey');
  });

  test('Like a post', async () => {
    const res = await request(app)
      .post(`/api/community/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('likes', 1);
  });

  test('Comment on a post', async () => {
    const res = await request(app)
      .post(`/api/community/${postId}/comment`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Great job! Keep it up!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('content', 'Great job! Keep it up!');
  });

  test('Get post with comments', async () => {
    const res = await request(app)
      .get(`/api/community/${postId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title', 'My Eco Journey');
    expect(res.body).toHaveProperty('comments');
    expect(Array.isArray(res.body.comments)).toBeTruthy();
    expect(res.body.comments.length).toBeGreaterThan(0);
    expect(res.body.comments[0]).toHaveProperty('content', 'Great job! Keep it up!');
  });
});