import fetch from 'node-fetch';

export const getApiData = (argData, overrides = {}) => {
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

export const checkToken = async (apiData) => {
    const response = await execute(apiData);
    return response.totalCount > 0;
};

export const execute = async (apiData) => {
    const API_URL =
          `${apiData.resource.baseUrl}${apiData.resource.path}${apiData.queries ? encodeQueries(apiData.queries) : ''}`;
    console.log(apiData.method, API_URL);
    try {
        const response =
              await fetch(API_URL, {
                  method: apiData.method,
                  body: Object.keys(apiData.body).length !== 0 ? JSON.stringify(apiData.body) : null,
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
        // skip null params
        if (!queries[query] || query === 'access_token') continue;
        let buildStr = `&${encodeURIComponent(query)}=${encodeURIComponent(queries[query])}`.replace(/\"/g,'');
        queryStr += buildStr;
    }
    // utils.log('debug', `Param string: ${paramStr}`);
    return queryStr;
};

export const asyncForEach = async (array, callback) => {
    for (let i = 0; i < array.length; i++) {
        // callback = (batch) => { batch.map(asyncFunc).map(p => p.catch(reject))
        console.log(`Running batch ${i + 1}...`);
        await callback(array[i], i, array);
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
