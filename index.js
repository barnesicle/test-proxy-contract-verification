const proxy = require('./proxy')
const fs = require('fs')

const port = process.env.PORT || 3000;
const proxyURL = process.env.PROXY_URL;
const dataPath =  process.env.DATA_PATH;
const cacheMode =  process.env.CACHE_MODE || 'false';

console.log('starting with', port, proxyURL, dataPath, cacheMode)
console.log('DATA_PATH exists?', fs.existsSync(dataPath))

proxy.config({
	port: port,
	proxyURL:  proxyURL,
	data:  typeof dataPath !== 'undefined' ? require(dataPath) : require('./proxy-data/data.js'),
	learnMode: 'false',
	cacheMode: cacheMode,
	updateCache: 'false'
}).validate().run();

// TODO Be able to turn mocking off.