const proxy = require('./proxy')

proxy.config({
	port: process.env.PORT || 3000,
	proxyURL: 'http://dispatch-test.digitalriver.com',
	data: process.env.DATA_PATH || require('./data-hydra.js'),
	learnMode: 'false',
	useCache: true,
	updateCache: false
}).validate().run();

// TODO Be able to turn mocking off.