import fetch from 'node-fetch';
import * as Validate from './validate.js';
import * as Console from './console.js';

export const getApiData = (argData, overrides = {}) => {
    const hasOverrides = Object.keys(overrides).length !== 0;
    if (hasOverrides) {
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
            body: overriddenArgData.body ? JSON.parse(overriddenArgData.body) : null,
            queries: {
                'access_token': overriddenArgData.token,
                filter: overriddenArgData.filter ? JSON.parse(overriddenArgData.filter) : ''
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
        body: argData.body? argData.body : {},
        queries: {
            'access_token': argData.token,
            filter: argData.filter ? JSON.parse(argData.filter) : ''
        },
        headers: {
            'Content-Type': 'application/json',
            ...(argData.headers ? argData.headers : {})
        }
    };
};

export const getEnvUrl = (argData) => {
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

export const getPathFromOpts = (argData) => {
    let path = '';
    switch (argData.resource) {
    case 'workspaces':
        path = '/workspaces';
        break;
    case 'workspace':
        Validate.checkForMissingArgs(argData, ['worskpaceId']);
        path = `/workspaces/${argData.workspaceId}`;
        break;
    case 'records':
        Validate.checkForMissingArgs(argData, ['formId']);
        path = `/forms/${argData.formId}/records.json`;
        break;
    case 'record':
        Validate.checkForMissingArgs(argData, ['formId', 'recordId']);
        path = `/forms/${argData.formId}/records/${argData.recordId}.json`;
        break;
    default:
        console.log(`Resource ${argData.resource} not yet implemented`);
        break;
    }
    return path;
};

export const checkToken = async (argv) => {
    const tokenRequestData = getApiData(argv, {
        resource: 'workspaces',
        _: [ 'GET' ],
        filter: null,
        headers: null,
        body: null
    });
    const response = await execute(tokenRequestData);
    return response.totalCount > 0;
};

export const execute = async (apiData) => {
    const API_URL =
          `${apiData.resource.baseUrl}${apiData.resource.path}${apiData.queries ? encodeQueries(apiData.queries) : ''}`;
    // console.log(apiData.method, API_URL);
    // console.log(apiData.method, '' + apiData.resource.baseUrl + apiData.resource.path);    
    try {
        const response =
              await fetch(API_URL, {
                  method: apiData.method,
                  body: apiData.body ? apiData.body : null,
                  headers: apiData.headers ? apiData.headers
                  : ''
              });
        const data = await response.json();
        if (data.status > 400) throw new Error(`hey! ` + JSON.stringify(data));
        return data;
    } catch (err) {
        // console.error(err.message);
        console.error(err);
        throw err;
    }    
};

export const encodeQueries = (queries) => {
    let queryStr = `?access_token=${queries["access_token"]}`;
    for (const query in queries) {
        const hasNoQueriesOrIsAccessToken = (!queries[query] || query === 'access_token');
        if (hasNoQueriesOrIsAccessToken) continue;
        let buildStr = `&${encodeURI(query)}=${encodeURI(queries[query])}`.replace(/\"/g,'');
        queryStr += buildStr;
    }
    return queryStr;
};

export const asyncForEach = async (array, callback) => {
    for (let i = 0; i < array.length; i++) {
        console.log(`Running batch ${i + 1}...`);
        await callback(array[i], i, array);
        Console.clearLastLine();
        Console.clearLastLine();
        console.log(`Batch ${i + 1} done.`);
        console.log(Console.progressBar(Console.percent(i, array.length)));
    }
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

export const throttleRequests = (batchData, batchSize = 20, delay = 200) => {
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(batchData, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map(req => execute(req)).map(p => p.catch(reject));
            const results = await Promise.all(promises);
            output.push(...results);
            await delayMS(delay);
        });
        resolve(output);
    });
};
