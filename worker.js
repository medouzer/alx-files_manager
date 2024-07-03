import Bull from 'bull';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
    const { userId, fileId } = job.data;
    if (!fileId) {
        return done(new Error('Missing fileId'));
    }
    if (!userId) {
        return done(new Error('Missing userId'));
    }

    const file = await dbClient.db.collection('files').findOne({ _id: fileId, userId });
    if (!file) {
        return done(new Error('File not found'));
    }

    const sizes = [500, 250, 100];
    for (const size of sizes) {
        const options = { width: size };
        try {
            const thumbnail = await imageThumbnail(file.localPath, options);
            const thumbnailPath = `${file.localPath}_${size}`;
            fs.writeFileSync(thumbnailPath, thumbnail);
        } catch (err) {
            return done(err);
        }
    }
    done();
});
