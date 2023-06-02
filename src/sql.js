import mysql from 'mysql';

export const getConnData = (argData) => {
    return {
        host: argData.host,
        user: argData.user,
        password: argData.password,
        database: argData.database,
        port: argData.port,
        multipleStatements: true
    };
};

export const getSqlConnection = async (argData) => {
    const sqlConnection = await connect(argData);
    return sqlConnection;
};

export const connect = async (argData) => {
    const sqlConnection = mysql.createConnection(getConnData(argData));
    await sqlConnection.connect(function (err) {
        if (err) {
            console.log("Cannot connect to SQL database.");
            throw err;
            process.exit(1);
        } else {
            console.log('Connected to Database!');
        }
    });
    return sqlConnection;
};

export const query = async (sqlConnection, query) => {
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

export const workspaceIsDeleted = async (argData, sqlConnection, workspaceData) => {
    const queryString = `SELECT * FROM workspaces
    WHERE id = ${workspaceData.workspace_id}
    AND deleted = 1;
    `
    const res = await query(sqlConnection, queryString);
    return res.length > 0;
};

export const userIsInWorkspace = async (argData, sqlConnection, workspaceData) => {
    const queryString = `SELECT * FROM workspaces_users
    WHERE workspace_id = ${workspaceData.workspace_id}
    AND user_id = ${argData.userId}
    AND deleted = 0;
    `
    const res = await query(sqlConnection, queryString);
    return res.length > 0;
};

// TODO :: remove test query
export const getTransferWorkspaceSql = async (argData, sqlConnection, workspaceData) => {
    const userIsMemberOfWorkspace = await userIsInWorkspace(argData, sqlConnection, workspaceData);
    const hasMissingData = (workspaceData.workspace_id == ''
                            || workspaceData.owner_id == ''
                            || argData.userId == ''
                            || workspaceData.workspace_id == undefined
                            || workspaceData.owner_id == undefined
                            || argData.userId == undefined);
    let queryString;
    // TODO :: remove test query
    let testString = `SELECT * from workspaces where id = ${workspaceData.workspace_id}`;
    if (hasMissingData) {
        // Checks for missing data
        console.error("missing data");
        process.exit(1);
    }
    if (userIsMemberOfWorkspace) {
        // Sets new owner in workspaces table
        queryString = `UPDATE workspaces SET owned_by_user_id = ${argData.userId} WHERE id = ${workspaceData.workspace_id} AND owned_by_user_id = ${workspaceData.owner_id};`
        // Swaps role ids of current user and new user in workspaces_users
        queryString += ` UPDATE workspaces_users SET role_id = 2 WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${workspaceData.owner_id};`
        queryString += ` UPDATE workspaces_users SET role_id = 1 WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${argData.userId};`
        // Swaps role ids of current user and new user in user_workspace_roles
        queryString += ` UPDATE user_workspace_roles SET workspace_role_id = 2 WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${workspaceData.owner_id};`
        queryString += ` UPDATE user_workspace_roles SET workspace_role_id = 1 WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${argData.userId};`
    } else {
        // Sets new owner in workspaces table
        queryString = `UPDATE workspaces SET owned_by_user_id = ${argData.userId} WHERE id = ${workspaceData.workspace_id} AND owned_by_user_id = ${workspaceData.owner_id};`
        // Replaces role id of current user with new user in workspaces_users
        queryString += ` UPDATE workspaces_users SET user_id = ${argData.userId} WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${workspaceData.owner_id};`
        // Replaces role id of current user with new user in user_workspace_roles
        queryString += ` UPDATE user_workspace_roles SET user_id = ${argData.userId} WHERE workspace_id = ${workspaceData.workspace_id} AND user_id = ${workspaceData.owner_id};`
    }
    // TODO :: remove test query
    // return testString;
    return queryString;
};
