import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, replay) => {
        if (err) {
          reject(err);
        } else {
          resolve(replay);
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, replay) => {
        if (err) {
          reject(err);
        } else {
          resolve(replay);
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, replay) => {
        if (err) {
          reject(err);
        } else {
          resolve(replay);
        }
      });
    });
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
