export const checkForMissingArgs = (argData, args) => {
    for (let arg of args) {
        if (! Object.keys(argData).includes(arg)) {
            console.log(`Error: missing argument: `, arg);
            process.exit(1);
        }
    }
};

