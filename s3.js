const fs = require('fs');
const AWS = require('aws-sdk');

const bucket = 'custom-dev.bear2b.com'

const s3 = new AWS.S3({
    accessKeyId: '---', // process.env.AWS_ACCESS_KEY,
    secretAccessKey: '---', // process.env.AWS_SECRET_ACCESS_KEY
});

const fileName = 'README.md';
const fileKey = 'README.md'; // Should be unique!!!

const uploadFile = () => {
    fs.readFile(fileName, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: bucket,
            Key: fileKey, 
            Body: JSON.stringify(data, null, 2)
        };
        s3.upload(params, function (s3Err, data) {
            if (s3Err) throw s3Err
            console.log(`File uploaded successfully at ${data.Location}`)
        });
    });
};

uploadFile();