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
    const testWorskpace = (await parseCSVData(argData.file))[0];
    workspaces.push(testWorskpace);
    return workspaces;
    // const batchData = await batchWorkspaces(argData, method);
    // return {
    //     batchData: batchData 
    // };
};


export const transferWorkspace = async (sqlConnection, query) => {
    return await Sql.query(sqlConnection, query);
    // const transferResult = await Sql.query(argData, sqlConnection, transferQuery);
    // const sqlData = {
    //     sqlConnection: sqlConnection,
    //     query: query
    // };
    // return transferResult;
};

export const batchWorkspaces = async (argData, method) => {
    const requests = [];
    // TODO :: Read in from file, get ws id's, and batch them
    for (const workspace of workspaces) {
        // const apiData = Api.getApiData(argData, {
        //     _: [ `${method}` ],
        //     recordId: workspace.id,
        //     resource: 'workspace'
        // });
        // requests.push(apiData);
    }
    return requests;
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
        await callback(array[i], i, array);
        console.log(`Done!`);
    }
};

export const runDeleteJobs = async (jobs, batchSize = 20, delay = 200) => {
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(jobs, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map(job => {
                // TODO :: Figure out a way to promisify the transfer and the delete together
                const transferData = job[0];
                const requestData = job[1];
                return [transferWorkspace(transferData.connection, transferData.query), requestData];
            }).map(p => p.catch(reject));
            const results = await Promise.all(promises);
            output.push(...results);
            await delayMS(delay);
        });
        resolve(output);
    });
};

export const testDeleteWorkspaces = async (argData) => {
    const sqlConnection = await Sql.getSqlConnection(argData);
    const workspacesData = await getWorkspacesData(argData, 'get');
    const deleteJobs = []
    for (const workspace of workspacesData) {
        // const workspaceData = workspacesData[0];
        const deleteJob = [];
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
        // console.log(transferQuery);
        // console.log(deleteRequest);
        const transferData = {
            query: transferQuery,
            connection: sqlConnection
        }
        deleteJob.push(transferData);
        deleteJob.push(deleteRequest);
        deleteJobs.push(deleteJob);
    }
    console.log(deleteJobs);
    await runDeleteJobs(deleteJobs);
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
