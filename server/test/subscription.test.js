const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Подключаем Express-приложение
const Subscription = require('../src/models/Subscription');

describe('Subscription API', () => {
  let createdSubId;

  beforeAll(async () => {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/subscriptions_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    } catch (error) {
      console.error('Ошибка подключения к MongoDB:', error);
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.db.dropDatabase(); // Удаляем тестовую БД
      await mongoose.connection.close(); // Закрываем соединение
    } catch (error) {
      console.error('Ошибка при закрытии MongoDB:', error);
    }
  });

  afterEach(async () => {
    await Subscription.deleteMany({}); // Очищаем коллекцию после каждого теста
  });

  /** Тест: Создание новой подписки (POST) */
  test('POST /api/subscriptions - должен создавать подписку', async () => {
    const newSub = {
      name: 'Netflix',
      cost: 10,
      startDate: '2023-01-01'
    };
  
    const response = await request(app)
      .post('/api/subscriptions')
      .send(newSub)
      .expect(201);
  
    expect(response.body._id).toBeDefined();
    expect(response.body.name).toBe(newSub.name);
    expect(response.body.cost).toBe(newSub.cost);
    expect(response.body.startDate.slice(0, 10)).toBe(newSub.startDate); // Исправлено
  
    createdSubId = response.body._id;
  });

  /** Тест: Получение всех подписок (GET) */
  test('GET /api/subscriptions - должен возвращать массив подписок', async () => {
    await Subscription.create({
      name: 'Spotify',
      cost: 5,
      startDate: '2023-02-01'
    });

    const response = await request(app)
      .get('/api/subscriptions')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  /** Тест: Получение одной подписки по ID (GET) */
  test('GET /api/subscriptions/:id - должен возвращать подписку', async () => {
    const newSub = await Subscription.create({
      name: 'Amazon Prime',
      cost: 15,
      startDate: '2023-03-01'
    });

    const response = await request(app)
      .get(`/api/subscriptions/${newSub._id}`)
      .expect(200);

    expect(response.body._id).toBeDefined();
    expect(response.body.name).toBe(newSub.name);
    expect(response.body.cost).toBe(newSub.cost);
  });

  /** Тест: Запрос несуществующей подписки (GET) */
  test('GET /api/subscriptions/:id - должен возвращать 404, если подписки нет', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/subscriptions/${fakeId}`)
      .expect(404);

    expect(response.body.message).toBe('Subscription not found');
  });

  /** Тест: Обновление подписки (PUT) */
  test('PUT /api/subscriptions/:id - должен обновлять подписку', async () => {
    const newSub = await Subscription.create({
      name: 'Disney+',
      cost: 8,
      startDate: '2023-04-01'
    });

    const updatedData = {
      name: 'Disney+ Updated',
      cost: 12
    };

    const response = await request(app)
      .put(`/api/subscriptions/${newSub._id}`)
      .send(updatedData)
      .expect(200);

    expect(response.body.name).toBe(updatedData.name);
    expect(response.body.cost).toBe(updatedData.cost);
  });

  /** Тест: Обновление несуществующей подписки (PUT) */
  test('PUT /api/subscriptions/:id - должен возвращать 404, если подписка не найдена', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const updatedData = { name: 'Non-Existent', cost: 20 };

    const response = await request(app)
      .put(`/api/subscriptions/${fakeId}`)
      .send(updatedData)
      .expect(404);

    expect(response.body.message).toBe('Subscription not found');
  });

  /** Тест: Удаление подписки (DELETE) */
  test('DELETE /api/subscriptions/:id - должен удалять подписку', async () => {
    const newSub = await Subscription.create({
      name: 'YouTube Premium',
      cost: 11,
      startDate: '2023-05-01'
    });

    await request(app)
      .delete(`/api/subscriptions/${newSub._id}`)
      .expect(200);

    const checkSub = await Subscription.findById(newSub._id);
    expect(checkSub).toBeNull();
  });

  /** Тест: Удаление несуществующей подписки (DELETE) */
  test('DELETE /api/subscriptions/:id - должен возвращать 404, если подписка не найдена', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/subscriptions/${fakeId}`)
      .expect(404);

    expect(response.body.message).toBe('Subscription not found');
  });
});
