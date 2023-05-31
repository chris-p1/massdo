import 'dotenv/config';
import yargs from 'yargs';
import * as Api from './api.js';
import * as Sql from './sql.js';
import * as Commands from './commands.js';
import * as Validate from './validate.js';

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
                nargs: 1,
                alias: ['r','resource']
              })
      .option('form-id',
              { describe: 'A form ID.',
                requiresArg: true,
                alias: ['form-id']
              })
      .option('workspace-id',
              { describe: 'A workspace ID.',
                requiresArg: true,
                alias: ['workspace-id','w']
              })
      .option('record-id',
              { describe: 'A record ID.',
                requiresArg: true,
              })
      .option('user-id',
              { describe: 'A user ID.',
                requiresArg: true,
                default: process.env.ZENGINE_USER,
              })
      .option('batch-size',
              { alias: ['b', 'batch-size'],
                describe: 'Batch sizing. Determines number of requests per batch',
                demandOption: true,
                default: 20
              })
      .option('delay',
              { describe: 'Delay a between batch processing (in milliseconds).',
                requiresArg: true
              })
      .option('filter',
              { describe: 'A zengine data filter.',
                requiresArg: true
              })
      .option('body',
              { describe: 'A request body.',
                requiresArg: true
              })
      .option('file',
              { alias: ['f'],
                describe: 'A file to read in',
                requiresArg: true
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
      .command({ command: 'delete-all-records',
                 desc: 'Delete all records'
               })
      .command({ command: 'test-delete-all-records',
                 desc: 'Dry run of delete-all-records'
               })
      .count('verbose')
      .alias('v', 'verbose')
      .help('h')
      .alias('h', 'help')
      .version('v0.0.1')
      .argv;

const runCommand = async (argData) => {
    const command = argData._[0];
    if (!command) {
        console.log(`Error: Missing command.\n\nUsage: ${argData['$0']} [options] COMMAND`);
        process.exit(1);
    }
    switch (command) {
    case 'get':
        Validate.checkForMissingArgs(argData, [ 'resource' ]);
        await Commands.getResource(argData);
        break;
    case 'put':
        Validate.checkForMissingArgs(argData, [ 'resource', 'body' ]);
        await Commands.putResource(argData);
        break;
    case 'delete':
        Validate.checkForMissingArgs(argData, [ 'resource' ]);
        await Commands.deleteResource(argData);
        break;
    case 'delete-all-records':
        Validate.checkForMissingArgs(argData, [ 'formId', 'batchSize' ]);
        await Commands.deleteAllRecords(argData);
        break;
    case 'test-delete-all-records':
        Validate.checkForMissingArgs(argData, [ 'formId', 'batchSize' ]);
        await Commands.testDeleteAllRecords(argData);
        break;        
    case 'test-delete-workspaces':
        console.log('Delete workspaces feature coming soon!');
        Validate.checkForMissingArgs(argData, [ 'userId' ]);
        await Commands.testDeleteWorkspaces(argData);
        break;
    default:
        console.log(`Error: Unknown command: ${command}`);
        process.exit(1);
    }
};

(async () => {
    // console.log(argv);
    console.log("checking token...");
    const validToken = await Api.checkToken(argv);
    if (!validToken) {
        console.log('Error: The access token provided is invalid.');
        process.exit(1);
    }
    console.log('checking token... done.');
    await Api.delayMS(200);
    console.log('Processing request...');
    await runCommand(argv);
    console.log('Done! Goodbye.');
    process.exit(0);
})()
