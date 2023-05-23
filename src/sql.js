import mysql from 'mysql';

export const getConnData = (argData) => {
    return {
        host: argData.host,
        user: argData.user,
        password: argData.password,
        database: argData.database,
        port: argData.port
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

export const query = async (argData, sqlConnection, query) => {
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


