import 'dotenv/config';
import * as Api from './api.js';
import * as Sql from './sql.js';

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

export const getWorkspacesData = async (argData, method) => {
    const batchData = await batchWorkspaces(argData, method);
    return {
        batchData: batchData 
    };
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

export const testDeleteWorkspaces = async (argData) => {
    const workspacesData = await getWorkspacesData(argData);
};

export const getResource = async (argData) => {
    const apiData = Api.getApiData(argData);
    const response = await Api.execute(apiData);
    console.log(response);
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
