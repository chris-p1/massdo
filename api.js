import fetch from 'node-fetch';

export const get = async (resourceData, requestData) => {
    return await execute(resourceData, 'GET', requestData);
};

export const put = (resourceData, requestData) => {
    return 'put';
};

export const post = (resource, headers, queries, body) => {
    return 'post';
};

export const del = (resource, headers, queries, body) => {
    return 'delete';
};

export const checkToken = async (requestData) => {
    const response = await execute(requestData);
    return response.totalCount > 0;
};

export const execute = async (requestData) => {
    const API_URL =
          `${requestData.resource.baseUrl}${requestData.resource.path}${requestData.queries ? encodeQueries(requestData.queries) : ''}`;
    console.log(requestData.method, API_URL);
    try {
        const response =
              await fetch(API_URL, {
                  method: requestData.method,
                  body: Object.keys(requestData.body).length !== 0 ? JSON.stringify(requestData.body) : null,
                  headers: requestData.headers ? requestData.headers
                  : ''
              });
        const data = await response.json();
        if (data.status > 400) throw new Error(JSON.stringify(data));
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

export const throttle = (requests, callback, batchSize, delay) => {
    
};

export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
export function split(arr, n) {
    var res = [];
    while (arr.length) {
        res.push(arr.splice(0, n));
    }
    return res;
}
export const delayMS = (t = 200) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(t);
        }, t);
    });
};
export const throttleRequests = (
    asyncFunction,
    requestItems = [],
    batchSize = 200,
    delay = 200
) => {
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(requestItems, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map(asyncFunction).map(p => p.catch(reject));
            const results = await Promise.all(promises);
            output.push(...results);
            await delayMS(delay);
        });
        resolve(output);
    });
};
