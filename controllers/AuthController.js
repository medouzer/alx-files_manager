import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).send({ error: 'Unauthorized' });
    try {
      const base64Credentials = authorization.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const auth = credentials.split(':');

      const email = auth[0];
      const password = sha1(auth[1]);

      const collection = dbClient.db.collection('users');
      const user = await collection.findOne({ email, password });
      if (!user || (password !== user.password)) return res.status(401).send({ error: 'Unauthorized' });
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);

      return res.status(200).send({ token });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) return res.status(401).send({ error: 'Unauthorized' });
      await redisClient.del(key);
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Server error' });
    }
  }
}

module.exports = AuthController;
