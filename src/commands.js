import 'dotenv/config';
import * as Api from './api.js';
import * as Sql from './sql.js';
import csv from 'csv-parser';
import fs from 'fs';

export const getAllRecordsData = async (argData, method) => {
    const sqlConnection = await Sql.getSqlConnection(argData);
    const query = `SELECT id FROM zn_form${argData.formId}_records`;
    const sqlData = {
        sqlConnection: sqlConnection,
        query: query
    };
    const batchData = await batchRecords(argData, sqlData, method);
    return {
        sqlData: sqlData,
        batchData: batchData
    };
};

export const parseCSVData = async (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

export const getWorkspacesData = async (argData, method) => {
    const workspaces = [];
    // TODO :: This only returns one workspace for testing. Change for final form
    const testWorskpace = (await parseCSVData(argData.file))[0];
    workspaces.push(testWorskpace);
    return workspaces;
};


export const transferWorkspace = async (sqlConnection, query) => {
    let result;
    try {
        result = await Sql.query(sqlConnection, query);
    } catch (err) {
        console.log(err)
        process.exit(1);
    }
    return result;
};

export const batchRecords = async (argData, sqlData, method) => {
    const requests = [];
    const recordIds =
          await Sql.query(argData, sqlData.sqlConnection, sqlData.query);
    for (const record of recordIds) {
        const apiData = Api.getApiData(argData, {
            _: [ `${method}` ],
            recordId: record.id,
            resource: 'record'
        });
        requests.push(apiData);
    }
    return requests;
};

export const deleteAllRecords = async (argData) => {
    const allRecordsData = await getAllRecordsData(argData, 'delete');
    await Api.throttleRequests(allRecordsData.batchData, argData.batchSize, argData.delay);
};

export const testDeleteAllRecords = async (argData) => {
    const allRecordsData = await getAllRecordsData(argData, 'get');
    await Api.throttleRequests(allRecordsData.batchData, argData.batchSize, argData.delay);
};

export function split(arr, n) {
    var res = [];
    for (let i = 0; i < arr.length; i += n) {
        res.push(arr.slice(i, i + n));
    }
    return res;
};

export const delayMS = (t = 200) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(t);
        }, t);
    });
};

export const asyncForEach = async (array, callback) => {
    for (let i = 0; i < array.length; i++) {
        console.log(`Running delete job ${i + 1}...`);
        const res = await callback(array[i], i, array);
        console.log(`Done!`);
        console.log(res);
    }
};

export const runDeleteJob = async (job) => {
    return new Promise((resolve, reject) => {
        const jobResult = [];
        let transferPromise;
        let deletePromise;
        transferPromise =
            transferWorkspace(job.transferData.connection, job.transferData.query);
        deletePromise = Api.execute(job.requestData);
        jobResult.push([transferPromise, deletePromise]);
        console.log(jobResult);
        resolve(jobResult);
    });
};

export const runDeleteJobs = async (jobs, batchSize = 20, delay = 200) => {
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(jobs, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map((job) => {
                // TODO :: Figure out a way to promisify the transfer and the delete together
                return runDeleteJob(job);
            }).map(p => p.catch(reject));;
            const results = await Promise.all(promises);
            output.push(...results);
            await delayMS(delay);
            resolve(output);
        });
    });
};

export const getDeleteJobs = async (argData, sqlConnection, workspacesData) => {
    const deleteJobs = []
    for (const workspace of workspacesData) {
        const workspaceIsAlreadyDeleted = await Sql.workspaceIsDeleted(argData, sqlConnection, workspace);
        if (workspaceIsAlreadyDeleted) {
            console.log(`Workspace ${workspace.workspace_id} is already deleted. Skipping...`);
            continue;
        }
        const transferQuery = await Sql.getTransferWorkspaceSql(argData, sqlConnection, workspace);
        const deleteRequest = await Api.getApiData(argData, {
            _: ['delete'],
            resource: 'workspace',
            workspaceId: workspace.workspace_id
        });
        const deleteJob = {
            transferData: {
                query: transferQuery,
                connection: sqlConnection
            },
            requestData: deleteRequest
        };
        deleteJobs.push(deleteJob);
    }
    return deleteJobs;
};

export const testDeleteWorkspaces = async (argData) => {
    const sqlConnection = await Sql.getSqlConnection(argData);
    const workspacesData = await getWorkspacesData(argData, 'get');
    const deleteJobs = await getDeleteJobs(argData, sqlConnection, workspacesData);
    console.log(deleteJobs);
    await runDeleteJobs(deleteJobs, argData.batchSize, argData.delay);
    // console.log(workspacesData);
};

export const getResource = async (argData, overrides) => {
    const apiData = Api.getApiData(argData, overrides);
    const response = await Api.execute(apiData);
    return response;
};

// TODO :: make generic crud commands
export const deleteResource = async (argData) => {
    const apiData = Api.getApiData(argData, {
        _: [ `delete` ]
    });
    await Api.execute(apiData);
};

// TODO :: make generic crud commands
export const putResource = async (argData) => {
    const apiData = Api.getApiData(argData);
    const res = await Api.execute(apiData);
    console.log(res);
};
