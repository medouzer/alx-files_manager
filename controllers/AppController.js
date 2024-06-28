const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');


class AppController {
    async getStatus(req, res) {
        const redisStatus = await redisClient.isAlive();
        const dbStatus = await dbClient.isAlive();

        res.status(200).send({
            redis: redisStatus,
            db: dbStatus
        });
    }

    async getStats(req, res) {
        const usersCount = await dbClient.nbUsers();
        const filesCount = await dbClient.nbFiles();

        res.status(200).send({
            users: usersCount,
            files: filesCount
        });
    }
}

module.exports = AppController;
