import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectID } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, writeFile, readFileSync } from 'fs';


class FilesController {
    static async postUpload(req, res) {
        const folder_path = process.env.FOLDER_PATH || '/tmp/files_manager';
        const token = req.headers['x-token'];
        if (!token) return res.status(401).send({ error: 'Unauthorized' });
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });
        const fileName = req.body.name;
        if (!fileName) return res.status(400).send({ error: 'Missing name' });

        const fileType = req.body.type;
        if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

        const fileData = req.body.data;
        if (!fileData && fileType !== 'folder') return res.status(400).send({ error: 'Missing data' });

        const publicFile = req.body.isPublic || false;
        let parentId = req.body.parentId || 0;
        parentId = parentId === '0' ? 0 : parentId;
        if (parentId !== 0) {
        const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
        if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
        }

        const collection = dbClient.db.collection('files');

        const fileInsertData = {
        userId: userId,
        name: fileName,
        type: fileType,
        isPublic: publicFile,
        parentId
        };

        if (fileType === 'folder') {
        await collection.insertOne(fileInsertData);
        return res.status(201).send({
            id: fileInsertData._id,
            userId: fileInsertData.userId,
            name: fileInsertData.name,
            type: fileInsertData.type,
            isPublic: fileInsertData.isPublic,
            parentId: fileInsertData.parentId
        });
        }

        const fileUid = uuidv4();

        const decData = Buffer.from(fileData, 'base64');
        const filePath = `${folder_path}/${fileUid}`;

        mkdir(folder_path, { recursive: true }, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
        });

        writeFile(filePath, decData, (error) => {
        if (error) return res.status(400).send({ error: error.message });
        return true;
        });
        fileInsertData.localPath = filePath;
        await collection.insertOne(fileInsertData);

        return res.status(201).send({
        id: fileInsertData._id,
        userId: fileInsertData.userId,
        name: fileInsertData.name,
        type: fileInsertData.type,
        isPublic: fileInsertData.isPublic,
        parentId: fileInsertData.parentId
        });
    }

    static async getShow(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).send({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const collection = dbClient.db.collection('files');
        const file = await collection.findOne({ _id: fileId, userId });

        if (!file) return res.status(404).send({ error: 'Not found' });

        return res.status(200).send(file);
    }

    static async getIndex(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).send({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const { parentId = 0, page = 0 } = req.query;
        const pageSize = 20;
        const skip = page * pageSize;

        const files = await dbClient.db.collection('files').find({ userId, parentId })
            .skip(skip)
            .limit(pageSize)
            .toArray();

        return res.status(200).send(files);
    }
}

module.exports = FilesController;
