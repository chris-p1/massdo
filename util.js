export const checkForMissingArgs = (argData, args) => {
    for (let arg of args) {
        if (! Object.keys(argData).includes(arg)) {
            console.log(`Error: missing argument: `, arg);
            process.exit(1);
        }
    }
};

export const status = (message) => {
  const consoleWidth = process.stdout.columns;
  const statusWidth = message.length;
  const currentPosition = process.stdout.cursor;

  if (currentPosition + statusWidth <= consoleWidth) {
    process.stdout.cursorTo(currentPosition);
    process.stdout.write(message);
  } else {
    process.stdout.cursorTo(consoleWidth - statusWidth);
    process.stdout.write(message);
  }
};

export const clearLastLine = () => {
    process.stdout.moveCursor(0, -1) // up one line
    process.stdout.clearLine(1) // from cursor to end
};

export const percent = (num, outOf) => {
    return ((num / outOf) * 100).toFixed(2);
};

export const progressBar = (percent) => {
    let bar = '';
    // adjust for 80-width bar
    // TODO :: my math is off here. 
    let progress = parseInt((percent * 80) / 100);
    for (let i = 0; i < 80; i++) {
        if (i === 0) {
            bar += '[';
        } else if (i === 79) {
            bar += ']';
        } else if (i <= progress) {
            bar += '#';
        } else {
            bar += '-';
        }
    }
    return bar;
};
