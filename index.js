const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();
app.set('view engine', 'ejs');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./views'));
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const apiEndpoint = 'https://api.cloudmersive.com/convert/docx/to/pdf';
const apiKey = '1cb7a69a-7292-42ef-8cf6-dc2db93ffcfb';
const headers = {
    'Content-Type': 'application/octet-stream',
    'Apikey': apiKey
};

const util = require('util');
const unlink = util.promisify(fs.unlink);
// Promisified function to delete all files in the uploads folder
function deleteUploadedFiles() {
    return new Promise((resolve, reject) => {
    fs.readdir('uploads/', (err, files) => {
        if (err) {
        reject(err);
        return;
        }
        // Loop through all files in the uploads folder and delete them
        const promises = files.map(file => unlink('uploads/' + file));
        Promise.all(promises)
        .then(() => {
            console.log('All files deleted successfully');
            resolve();
        })
        .catch(reject);
    });
    });
}

app.get('/',(req,res)=>{
    res.render('upload');
    res.end();
});

app.post('/convert',  upload.array('myFiles'), (req, res) => {
    const inputFiles = req.files;
    const promises = inputFiles.map((file) => {
        const inputFilePath = file.path;
        const fileContents = fs.readFileSync(inputFilePath);
        const config = {
            headers: headers,
            responseType: 'arraybuffer'
        };
        return axios.post(apiEndpoint, fileContents, config)
        .then(response => {
            let originalName = file.originalname;
            originalName = originalName.replace('.docx', '.pdf');
            const outputFilePath = 'convertedFiles/' + originalName;
            fs.writeFileSync(outputFilePath, response.data);
            console.log('Word document converted to PDF successfully!');
        })
        .catch(error => {
            console.error(error);
        });
    });
    Promise.all(promises)
    .then(() => {
        return deleteUploadedFiles();
    })
    .catch((err) => {
        res.status(500).send('Error occurred while processing files');
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});