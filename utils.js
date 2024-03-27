// Log a message with a color
function log(message, color = 'reset') {
	const colors = {
		'red': '\033[31m',
		'green': '\033[32m',
		'lightGreen': '\033[92m',
		'yellow': '\033[33m',
		'blue': '\033[34m',
		'lightBlue': '\033[94m',
		'magenta': '\033[35m',
		'cyan': '\033[36m',
		'lightCyan': '\033[96m',
		'white': '\033[37m',
		'reset': '\033[0m'
	};

	console.log(colors[color] + message + colors['reset']);
}

function logError(message, error) {
	log(message, 'red');

	if (error)
		log("{ERROR}: " + error.message, 'magenta');
}

function logCatch(error) {
	logError("An error occurred: ", error);
}

module.exports = { log, logError, logCatch };
