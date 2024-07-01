import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';


class FilesController {
    static async postUpload(req, res) {
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        const token = req.headers['x-token'];
        if (!token) return res.status(401).send({ error: 'Unauthorized' });
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });
        const { name, type, parentId = 0, isPublic = false, data } = req.body;
        if (!name) return res.status(400).send({ error: 'Missing name' });
        if (!['folder', 'file', 'image'].includes(type)) return res.status(400).send({ error: 'Missing type' });
        if (!data && type != folder) return res.status(400).send({ error: 'Missing data' });

        const collection = dbClient.db.collection('files');
        if (parentId != 0) {
            const parent = await collection.findOne({ _id: parentId });
            if (!parent) return res.status(400).send({ error: 'Parent not found' });
            if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
        }
        const fileDocument = {
            userId,
            name,
            type,
            isPublic,
            parentId,
        };
        if (type === 'folder') {
            const result = await collection.insertOne(fileDocument);
            return res.status(201).send({ result });
        }
        const filePath = path.join(FOLDER_PATH, uuidv4());
        const fileData = Buffer.from(data, 'base64');
        try {
            if (!fs.existsSync(FOLDER_PATH)) {
                fs.mkdirSync(FOLDER_PATH, { recursive: true });
            }

            fs.writeFileSync(filePath, fileData);
        } catch (err) {
            console.error(err);
            return res.status(500).send({ error: 'Error saving file' });
        }

        fileDocument.localPath = filePath;

        const result = await collection.insertOne(fileDocument);
        return res.status(201).send(result.ops[0]);
    }
}

module.exports = FilesController;