const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const levelUpper = level.toUpperCase().padEnd(5);
  
  let color = colors.reset;
  switch (level) {
    case 'error':
      color = colors.red;
      break;
    case 'warn':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.cyan;
      break;
    case 'debug':
      color = colors.blue;
      break;
    case 'db':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  let logMessage = `${colors.dim}[${timestamp}]${colors.reset} ${color}[${levelUpper}]${colors.reset} ${message}`;
  
  if (data) {
    logMessage += ` ${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`;
  }
  
  return logMessage;
};

export const logger = {
  error: (message, data = null) => {
    console.error(formatMessage('error', message, data));
  },
  
  warn: (message, data = null) => {
    console.warn(formatMessage('warn', message, data));
  },
  
  info: (message, data = null) => {
    console.log(formatMessage('info', message, data));
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', message, data));
    }
  },
  
  db: (message, data = null) => {
    console.log(formatMessage('db', message, data));
  },
  
  request: (req, res, responseTime = null) => {
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const ip = req.ip || req.connection.remoteAddress;
    
    let color = colors.green;
    if (status >= 500) color = colors.red;
    else if (status >= 400) color = colors.yellow;
    
    const timestamp = getTimestamp();
    let logMessage = `${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}[REQUEST]${colors.reset} ${method} ${url} ${color}${status}${colors.reset}`;
    
    if (responseTime) {
      logMessage += ` ${colors.dim}(${responseTime}ms)${colors.reset}`;
    }
    
    logMessage += ` ${colors.dim}IP: ${ip}${colors.reset}`;
    
    console.log(logMessage);
  }
};

