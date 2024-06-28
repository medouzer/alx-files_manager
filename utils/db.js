import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}`;
        this.mongoClient = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true,});
        this.mongoClient.connect()
            .then(() => {
                console.log('Connected to MongoDB');
                this.db = this.mongoClient.db(database);
            })
            .catch((err) => {
                console.error('MongoDB connection error:', err);
        });
    }

    isAlive() {
        return this.mongoClient.isConnected()
    }

    async nbUsers() {
        if (!this.db) {
            console.error('Database connection not established');
            return -1;
        }
        const usersCollection = this.db.collection('users');
        return usersCollection.countDocuments();
    }

    async nbFiles() {
        if (!this.db) {
            console.error('Database connection not established');
            return -1;
        }
        const filesCollection = this.db.collection('files');
        return filesCollection.countDocuments();
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
