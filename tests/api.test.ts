import request from 'supertest';
import Notification from '../src/models/Notification';
import { app, createUser, useDatabase } from './helpers';

useDatabase();

describe('auth', () => {
  it('registers, logs in, and returns the current user', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'ada', email: 'Ada@Example.com', password: 'password123' })
      .expect(201);

    const login = await request(app)
      .post('/api/login')
      .send({ email: 'ada@example.com', password: 'password123' })
      .expect(200);

    const me = await request(app).get('/api/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
    expect(me.body).toMatchObject({ username: 'ada', email: 'ada@example.com' });
    expect(me.body.password).toBeUndefined();
  });

  it('rejects duplicate accounts and weak passwords', async () => {
    await createUser('grace');
    await request(app)
      .post('/api/register')
      .send({ username: 'grace', email: 'other@example.com', password: 'password123' })
      .expect(409);
    await request(app)
      .post('/api/register')
      .send({ username: 'linus', email: 'linus@example.com', password: 'short' })
      .expect(422);
  });

  it('gives the same error for an unknown email and a wrong password', async () => {
    await createUser('alan');
    const unknown = await request(app).post('/api/login').send({ email: 'nobody@example.com', password: 'x' });
    const wrong = await request(app).post('/api/login').send({ email: 'alan@example.com', password: 'wrong-pass' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  it('requires a valid bearer token', async () => {
    await request(app).get('/api/feed').expect(401);
    await request(app).get('/api/feed').set('Authorization', 'Bearer not-a-token').expect(401);
  });
});

describe('follows', () => {
  it('follows and unfollows, keeping both sides in sync', async () => {
    const a = await createUser();
    const b = await createUser();

    await request(app).post(`/api/follow/${b.id}`).set(a.auth).expect(200);
    await request(app).post(`/api/follow/${b.id}`).set(a.auth).expect(409);

    let bProfile = await request(app).get(`/api/users/${b.id}`).set(a.auth);
    expect(bProfile.body.followersCount).toBe(1);

    await request(app).post(`/api/unfollow/${b.id}`).set(a.auth).expect(200);
    bProfile = await request(app).get(`/api/users/${b.id}`).set(a.auth);
    const aProfile = await request(app).get('/api/me').set(a.auth);
    expect(bProfile.body.followersCount).toBe(0);
    expect(aProfile.body.followingCount).toBe(0);
  });

  it("can't follow yourself or a user that doesn't exist", async () => {
    const a = await createUser();
    await request(app).post(`/api/follow/${a.id}`).set(a.auth).expect(400);
    await request(app).post('/api/follow/64b7f0000000000000000000').set(a.auth).expect(404);
    await request(app).post('/api/follow/not-an-id').set(a.auth).expect(400);
  });
});

describe('posts and feed', () => {
  it('creates a text post and lists it with counts', async () => {
    const a = await createUser();
    const created = await request(app).post('/api/posts').set(a.auth).send({ text: 'Hello world' }).expect(201);
    expect(created.body).toMatchObject({ text: 'Hello world', likesCount: 0, commentsCount: 0 });

    const list = await request(app).get('/api/posts').set(a.auth).expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1 });
    expect(list.body.data[0].user.username).toBe(a.username);
  });

  it('keeps the text when a post includes an image', async () => {
    const a = await createUser();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const res = await request(app)
      .post('/api/posts')
      .set(a.auth)
      .field('text', 'Look at this')
      .attach('file', png, { filename: 'dot.png', contentType: 'image/png' })
      .expect(201);
    expect(res.body.text).toBe('Look at this');
    expect(res.body.media).toMatch(/^\/uploads\/.+\.png$/);
  });

  it('rejects an empty post', async () => {
    const a = await createUser();
    await request(app).post('/api/posts').set(a.auth).send({ text: '   ' }).expect(422);
  });

  it('shows only followed users (and your own posts) in the feed, newest first', async () => {
    const me = await createUser();
    const friend = await createUser();
    const stranger = await createUser();

    await request(app).post(`/api/follow/${friend.id}`).set(me.auth).expect(200);
    await request(app).post('/api/posts').set(stranger.auth).send({ text: 'stranger post' });
    await request(app).post('/api/posts').set(friend.auth).send({ text: 'friend post' });
    await request(app).post('/api/posts').set(me.auth).send({ text: 'my post' });

    const feed = await request(app).get('/api/feed').set(me.auth).expect(200);
    expect(feed.body.data.map((p: any) => p.text)).toEqual(['my post', 'friend post']);
  });

  it('paginates', async () => {
    const a = await createUser();
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/posts').set(a.auth).send({ text: `post ${i}` });
    }
    const page2 = await request(app).get('/api/posts?page=2&limit=2').set(a.auth).expect(200);
    expect(page2.body).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(page2.body.data).toHaveLength(1);
  });

  it('only lets the author delete a post', async () => {
    const author = await createUser();
    const other = await createUser();
    const post = await request(app).post('/api/posts').set(author.auth).send({ text: 'mine' });

    await request(app).delete(`/api/posts/${post.body._id}`).set(other.auth).expect(403);
    await request(app).delete(`/api/posts/${post.body._id}`).set(author.auth).expect(200);
  });
});

describe('likes, comments and notifications', () => {
  it('likes once, unlikes, and reports likedByMe', async () => {
    const author = await createUser();
    const fan = await createUser();
    const post = await request(app).post('/api/posts').set(author.auth).send({ text: 'like me' });

    await request(app).post(`/api/posts/like/${post.body._id}`).set(fan.auth).expect(200);
    await request(app).post(`/api/posts/like/${post.body._id}`).set(fan.auth).expect(409);

    let list = await request(app).get(`/api/posts/${author.id}`).set(fan.auth);
    expect(list.body.data[0]).toMatchObject({ likesCount: 1, likedByMe: true });

    await request(app).post(`/api/posts/unlike/${post.body._id}`).set(fan.auth).expect(200);
    list = await request(app).get(`/api/posts/${author.id}`).set(fan.auth);
    expect(list.body.data[0]).toMatchObject({ likesCount: 0, likedByMe: false });
  });

  it('comments, and notifies the author and mentioned users — but not yourself', async () => {
    const author = await createUser();
    const commenter = await createUser();
    const mentioned = await createUser();
    const post = await request(app).post('/api/posts').set(author.auth).send({ text: 'thoughts?' });

    await request(app)
      .post(`/api/posts/comment/${post.body._id}`)
      .set(commenter.auth)
      .send({ text: 'Great post', mentionedUsers: [mentioned.id] })
      .expect(201);

    // Author comments on their own post: no self-notification
    await request(app).post(`/api/posts/comment/${post.body._id}`).set(author.auth).send({ text: 'thanks!' });

    const authorNotes = await request(app).get('/api/notifications').set(author.auth).expect(200);
    expect(authorNotes.body.data.map((n: any) => n.type)).toEqual(['comment']);
    expect(authorNotes.body.data[0].actor.username).toBe(commenter.username);

    const mentionedNotes = await request(app).get('/api/notifications').set(mentioned.auth);
    expect(mentionedNotes.body.data.map((n: any) => n.type)).toEqual(['mention']);
  });

  it('notifies on follow and like, and marks notifications read', async () => {
    const a = await createUser();
    const b = await createUser();
    const post = await request(app).post('/api/posts').set(a.auth).send({ text: 'hi' });

    await request(app).post(`/api/follow/${a.id}`).set(b.auth);
    await request(app).post(`/api/posts/like/${post.body._id}`).set(b.auth);

    const unread = await request(app).get('/api/notifications?unread=true').set(a.auth);
    expect(unread.body.total).toBe(2);

    await request(app).post('/api/notifications/read').set(a.auth).expect(200);
    expect(await Notification.countDocuments({ recipient: a.id, read: false })).toBe(0);
  });

  it('only shows you your own notifications', async () => {
    const a = await createUser();
    const b = await createUser();
    await request(app).post(`/api/follow/${a.id}`).set(b.auth);

    const bNotes = await request(app).get('/api/notifications').set(b.auth);
    expect(bNotes.body.total).toBe(0);
  });
});
