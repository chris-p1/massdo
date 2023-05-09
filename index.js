import 'dotenv/config';
import fs from 'fs';
import yargs from 'yargs';
import mysql from 'mysql';
import * as api from './api.js';
// import * as sql from './sql.js';

// TODO:: move sql code to own module
const sqlConnection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
    
});

async function sqlQuery(query) {
    if (sqlConnection == undefined || query == undefined) {
        return null;
    }
    return new Promise(function (resolve, reject) {
        sqlConnection.query(query, function (err, result) {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(result)));
        });
    })
};

const readJsonFile = async (filename) => {
    let rawdata = fs.readFileSync(filename);
    let jsondata = JSON.parse(rawdata);
    return await jsondata;
};

const writeJsonFile = async (filename, data) => {
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

const argv = yargs(process.argv.slice(2))
      .usage('$0 [options] <command>')
      .option('access-token',
              { describe: 'Developer access token.',
                requiresArg: true,
                demandOption:true,
                alias: ['a','t', 'token'],
                default: process.env.ACCESS_TOKEN
              })
      .option('environment',
              { describe: 'Environment to run in.',
                requiresArg: true,
                demandOption:true,
                alias: ['e','env'],
                default: process.env.ENVIRONMENT
              })
      .option('resource',
              { describe: 'Resource to action on. e.g.: "records"',
                demandOption:true,
                nargs: 1,
                alias: ['r','resource']
              })
      .option('form-id',
              { describe: 'A form ID.',
                requiresArg: true,
                demandOption:true,
                alias: ['f','form-id']
              })
      .option('batch-size',
              { alias: ['b', 'batch-size'],
                describe: 'Batch sizing. Determines number of requests per batch',
                demandOption: true,
                default: 20
              })
      .option('mysql-host',
              { describe: 'Database host name.',
                requiresArg: true,
                demandOption:true,
                alias: ['host'],
                default: process.env.MYSQL_HOST
              })
      .option('mysql-user',
              { describe: 'Database user.',
                requiresArg: true,
                demandOption:true,
                alias: ['user'],
                default: process.env.MYSQL_USER
              })
      .option('mysql-password',
              { describe: 'Database password.',
                requiresArg: true,
                demandOption:true,
                alias: ['password'],
                default: process.env.MYSQL_PASSWORD
              })
      .option('mysql-database',
              { describe: 'Database name.',
                requiresArg: true,
                demandOption:true,
                alias: ['database'],
                default: process.env.MYSQL_DATABASE
              })
      .option('mysql-port',
              { describe: 'Developer access token.',
                requiresArg: true,
                demandOption:true,
                alias: ['port'],
                default: process.env.MYSQL_PORT
              })
      .command({ command: 'delete',
                 desc: 'Delete specified resource'
               })
      .count('verbose')
      .alias('v', 'verbose')
      .help('h')
      .alias('h', 'help')
      .version('v0.0.1')
      .argv;

const clearLastLine = () => {
    process.stdout.moveCursor(0, -1) // up one line
    process.stdout.clearLine(1) // from cursor to end
};

// const createBatches = async (resourceData, requestData) => {
//     console.log('Creating batches...');
//     let batchList = [],
//         recordCount = 0,
//         currentPage = 1,
//         nextPageRequestData,
//         batchItem;
//     do {
//         nextPageRequestData = makeRequestData(requestData.env, {
//             "access_token": requestData.queries["access_token"],
//             limit: requestData.queries.limit,
//             page: currentPage
//         });
//         console.log(nextPageRequestData);
//         batchItem = await createBatch(resourceData, nextPageRequestData);
//         currentPage++;
//         batchList.push(batchItem);
//         recordCount = batchItem.length;
//     } while (recordCount == nextPageRequestData.queries.limit)
//     console.log('page number: ' + currentPage);
//     console.log('recordCount: ' + recordCount);
//     console.log('limit: ' + nextPageRequestData.queries.limit);
//     return batchList;
// }
// const createBatch = async (resourceData, requestData) => {
//     let batchItem = [],
//         batch = {};
//     console.log(`Batch ${requestData.queries.page}...`);
//     const records = await api.get(resourceData, requestData);
//     for (let record of records.data) {
//         const formRecord = makeResourceData('record', {
//             formId: resourceData.ids.formId,
//             recordId: record.id
//         });
//         batch = {
//             resourceData: formRecord,
//             requestData: requestData,
//             recordCount: records.data.length
//         };
//         batchItem.push(batch);
//     }
//     clearLastLine();
//     clearLastLine();
//     console.log(`Batch ${requestData.queries.page}... done.`);
//     //console.log(batch);
//     return batchItem;
// };

// TODO :: rewrite to simply add request/resource data. Batching will be done in api module.
// const createRecordBatches = (resourceData, requestData, listData, batchSize) => {
//     const batches = [];
//     for (let i = 0; i < listData.length; i += batchSize) {
//         const chunk = listData.slice(i, i + batchSize);
//         const batch = chunk.map((chunkItem) => {
//             const res = makeResourceData('record', {
//                     formId: resourceData.ids.formId,
//                     recordId: chunkItem.id
//             });
//             return {
//                 resourceData: res,
//                 requestData: requestData
//             };
//         });
//         batches.push(batch);
//     }
//     return batches;
// };

const getEnvUrl = (argData) => {
    let url = ''
    switch (argData.environment) {
    case 'prod':
        url = 'https://api.zenginehq.com/v1';
        break;
    default:
        console.log(`Environment ${argData.environment} not implemented yet.`);
        process.exit(1);
        break;
    }
    return url;
};

const getPathFromOpts = (argData) => {
    let path = '';
    switch (argData.resource) {
    case 'workspaces':
        path = '/workspaces';
        break;
    case 'records':
        path = `/forms/${argData.formId}/records.json`;
        break;
    case 'record':
        path = `/forms/${argData.formId}/records/${argData.recordId}.json`;
        break;
    default:
        console.log(`Resource ${argData.resource} not yet implemented`);
        break;
    }
    return path;
};

const getApiData = (argData, overrides = {}) => {
    if (Object.keys(overrides).length !== 0) {
        let overriddenArgData = { ...argData };
        for (let key of Object.keys(overrides)) {
            overriddenArgData[`${key}`] = overrides[`${key}`];
        }
        return {
            resource: {
                baseUrl: getEnvUrl(overriddenArgData),
                path: getPathFromOpts(overriddenArgData)
            },        
            method: overriddenArgData._[0].toUpperCase(),
            env: overriddenArgData.environment,
            body: {},
            queries: {
                'access_token': overriddenArgData.token,
                filter: overriddenArgData.filter ? overriddenArgData.filter : ''
            },
            headers: {
                'Content-Type': 'application/json',
                ...(overriddenArgData.headers ? overriddenArgData.headers : {})
            }
        };
    }
    return {
        resource: {
            baseUrl: getEnvUrl(argData),
            path: getPathFromOpts(argData)
        },        
        method: argData._[0].toUpperCase(),
        env: argData.environment,
        body: {},
        queries: {
            'access_token': argData.token,
            filter: argData.filter ? argData.filter : ''
        },
        headers: {
            'Content-Type': 'application/json',
            ...(argData.headers ? argData.headers : {})
        }
    };
};

const getSqlData = (argData) => {};

(async () => {
    console.log(argv);
    // TODO:: move sql code to own module
    // const sqlConnection = mysql.createConnection({
    //     host: argv.host,
    //     user: argv.user,
    //     password: argv.password,
    //     database: argv.database,
    //     port: argv.port
    
    // });
    await sqlConnection.connect(function (err) {
        if (err) {
            console.log("Cannot connect to SQL database.");
            throw err;
            process.exit(1);
        }
    });
    console.log('Connected to database!');
    console.log("checking token...");
    const requestData = getApiData(argv);
    const tokenRequestData = getApiData(argv, {
        resource: 'workspaces',
        _: [ 'GET' ]
    });
    // console.log(tokenRequestData);
    const validToken = await api.checkToken(tokenRequestData);
    if (!validToken) {
        clearLastLine();
        console.log('The access token provided is invalid.');
        process.exit(1);
    }
    clearLastLine();
    console.log('checking token... done.');
    await api.delayMS(200);
    console.log('Processing request...');
    // console.log(requestData);
    const recordIds = await sqlQuery(`SELECT id FROM zn_form${argv.formId}_records limit 50`);
    // console.log(results);
    // const recordsToDelete = createRecordrequests(requestData, recordIds);

    // TODO:
    // await api.throttle(recordsToDelete, api.del, argv.batchSize, delay);
    // await writeJsonFile('test', results);
    // console.log(`List of records written to file.`);
    // console.log(JSON.stringify(batchList, null, 4));
    
    process.exit(0);
//    createBatches(formRecords, requestData);
})()
