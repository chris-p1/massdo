import fs from 'fs';

export const readJsonFile = async (filename) => {
    let rawdata = fs.readFileSync(filename);
    let jsondata = JSON.parse(rawdata);
    return await jsondata;
};

export const writeJsonFile = async (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${process.cwd()}/${filename}.json`,
                     JSON.stringify(data, null, 4),
                     function(err) {
                         if (err) {
                             reject(err);
                         }
                         else {
                             resolve(`${process.cwd()}/${filename}.json`);
                         }
                     });
    });
};
