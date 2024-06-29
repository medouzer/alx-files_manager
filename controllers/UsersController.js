import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    try {
      const collection = dbClient.db.collection('users');
      const userExists = await collection.findOne({ email });
      if (userExists) return res.status(400).send({ error: 'Already exist' });

      const user = await collection.insertOne({
        email,
        password: sha1(password),
      });

      res.status(201).send({ id: user.insertedId, email });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) return res.status(401).send({ error: 'Unauthorized' });

      const collection = dbClient.db.collection('users');
      const user = await collection.findOne({ _id: ObjectId(userId) });
      if (!user) return res.status(401).send({ error: 'Unauthorized' });

      return res.status(200).send({ id: user._id, email: user.email });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Server error' });
    }
  }
}

module.exports = UsersController;
