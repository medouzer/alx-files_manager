import dbClient from '../utils/db';
import sha1 from 'sha1';

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
                password: sha1(password)
            });

            res.status(201).send({ id: user.insertedId, email });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Server error' });
        }
    }
}

module.exports = UsersController;
