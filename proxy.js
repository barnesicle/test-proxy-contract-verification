const utils = require('./utils')
const express = require('express')
const apiCaller = require('axios');
const bodyParser = require('body-parser')
const { expect, use } = require('chai');
const fs = require('fs');
const cors = require('cors')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

//process.on('exit', exitEvent);
//process.on('uncaughtException', uncaughtException);
//process.on('unhandledRejection', unhandledPromiseRejection);
process.on('SIGINT', function () {
	// TODO Do not run this if validation is turned off.

	if (dataToSave.length > 0) {
		console.warn('Writing requests to file')

		const data = [];
		dataToSave.forEach( d => {

			const occurrencesTest = function (n) {
				return d.path === n.path && d.method === n.method && JSON.stringify(d.response) === JSON.stringify(n.response) && JSON.stringify(d.params) ===  JSON.stringify(n.params);
			};

			const occurrences = dataToSave.filter(occurrencesTest);

			const alreadyExistsInCollection = data.filter(occurrencesTest).length === 0;
			if (alreadyExistsInCollection) {
				data.push({
					path: d.path,
					params: d.params,
					method: d.method,
					occurrences: occurrences.length,
					response: d.response,
					assertions: d.assertions
				});
			}
		});


		console.warn('Writing records to file', data.length)

		fs.writeFileSync('data-recorded.json', JSON.stringify(data, null, 2));
	}

	if (validationErrors.length > 0) {
		console.error('Shutting down with errors', validationErrors.length)
		process.exit(1);
	} else {
		console.debug('Shutting down with no errors')
		process.exit(0);
	}
});

const validationErrors = [];
const dataToSave = [];
let options;

function createApiCall(req) {

	console.log('creating API call with req', options.proxyURL+req.path, req.method, req.query, req.headers)

	const body = typeof req.body !== "undefined" && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null;
	const params = typeof req.query !== 'undefined' && Object.keys(req.query).length > 0 ? req.query : null;

	const headers = req.headers;
	delete headers.host;

	const requestOptions = {
		method: req.method,
		validateStatus: function () {
			return true;
		},
		//baseURL: options.proxyURL,
		url: options.proxyURL+req.path,
		params: params,
		headers: headers,
		data: body
	};

	return apiCaller.request(requestOptions);
}

function addMockRoutes() {
	console.log('Adding mock routes');
	options.data.forEach(mock => {

		const methodsForMock = utils.methods(mock);

		methodsForMock.forEach( method => {

			console.log('Adding mock endpoint for ', mock.path, method);

			app[method.toLowerCase()](mock.path, (req, res, next) => {

				if (mock.invalidated === true) {
					console.log('Mock is invalidated, skipping mock request', mock.path, req.method)
					next();
					return;
				}

				if (!mock.updateCache === true && (req.method.toLowerCase() === 'put' || req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'delete')) {
					console.log('Mock has been invalidated', mock.path, req.method)
					mock.invalidated = true;
				}

				console.warn('Running mock for path', req.path, ' and mock path', mock.path);

				const mockResponseAdded = typeof mock.transformResponse === 'undefined'

				if (mockResponseAdded) {
					utils.addMockResponse(mock, res, req);
				}

				createApiCall(req).then(async (response) => {
					const body = await response.data;
					//console.log('validating response', response.status, censorBody(body));
					console.log('Response', response.status);
					utils.validateMock(mock, response, body);

					if (!mockResponseAdded) {
						const transformedResponse = mock.transformResponse.task(req, body, mock.state);
						console.log('transformedResponse',transformedResponse)
						res.status(response.status)
						res.send(transformedResponse)
					}

					return body;
				}).catch(error => {
					validationErrors.push(error);
					console.error(error);
				});

			})


		});



	});
}

function config(suppliedOptions) {

	if (typeof suppliedOptions === 'undefined') {
		throw Error('Must provide options');
	}

	if (typeof suppliedOptions.proxyURL === 'undefined') {
		throw Error('Must provide proxyURL');
	}

	if (typeof suppliedOptions.data === 'undefined') {
		throw Error('Must provide data');
	}

	// TODO Validate only one route / method combo

	options = suppliedOptions;

	if (!utils.isLearningMode(options) && !utils.isCacheMode(options)) {
		addMockRoutes();
	}

	return {
		run: run,
		validate: validate
	}

}

function run() {

	app.all('/*', (req, res) => {

		console.log('PROXY Req', req.method, req.path )
		// TODO Cache based off headers as well!


		if (req.method !== 'GET' && utils.isUpdateCacheMode(options))  {

			const cacheTest = function (n) {
				return req.path === n.path && n.method === 'GET' && JSON.stringify(req.params) ===  JSON.stringify(n.params);
			};
			const cache = dataToSave.filter(cacheTest);

			console.log('Checking to update cache for ', cache, req.path, req.method)

			if (cache.length > 0) {
				console.log('ATTEMPTING Updating cache for', req.path, req.method)

				const cacheResponse = cache[0].response;

				if (req.method === 'POST') {
					if (Array.isArray(cacheResponse)) {
						console.log('Adding to array', req.path, req.method)
						cacheResponse.unshift(req.body)
					} else {
						console.log('Adding to object', req.path, req.method)
						cache[0].response = req.body;
					}
				}
				/*else if (req.method === 'DELETE') {
					// TODO WIll have to remove the id that is being deleted because the path will not match
				} */
				else {
					console.log('Invalidating cache because method is not supported', req.path, req.method)
					cache.forEach(c => c.invalidated = true)
				}

			} else {
				console.log('No cache found for ', req.path, req.method)
			}



		}

		if (req.method !== 'GET' && utils.isCacheMode(options) && !utils.isUpdateCacheMode(options)) {
			// TODO Invalidate GET cache
			console.log('Invalidating Cache')
			const cacheTest = function (n) {
				return req.path === n.path && n.method === 'GET';
			};
			const cache = dataToSave.filter(cacheTest);

			cache.forEach(c => c.invalidated = true)

		} else if (req.method === 'GET' && utils.isCacheMode(options)) {

			const cacheTest = function (n) {
				return req.path === n.path && n.method === 'GET'  && n.invalidated !== true && JSON.stringify(req.params) ===  JSON.stringify(n.params);
			};
			const cache = dataToSave.filter(cacheTest);

			if (cache.length > 0) {
				console.log('CACHE: Hitting cache for', req.path, req.method, JSON.stringify(cache[0].response))
				res.status(cache[0].assertions.statusCode);
				res.send(cache[0].response);
				return;
			}
		}

		createApiCall(req).then(response => {

			const body = response.data;

			res.status(response.status);

			Object.keys(response.headers).forEach(headerKey => {
				const header = response.headers[headerKey];
				if (headerKey !== 'transfer-encoding') {
					res.set(headerKey, header);
				}
			});

			// TODO If learning mode then save requests and responses
			if (utils.isLearningMode(options) || utils.isCacheMode(options)) {
				dataToSave.push(utils.createObjectToSave(req, body, response))
			}

			return body;
		}).then(body => {
			console.log('API RESPONSE (PROXY)', req.path, req.method); // TODO Censor
			res.send(body);
		}).catch(err => {
			res.send('ERROR. Check console.');
			console.log(err);
		});

	})

	const port = options.port || 3000
	app.listen(port, () => {
		console.log(`App listening on port ${port}`)
	})

}

function validate() {

	// TODO Loop through data and verify the mocked responses match the assertions

	return {
		run: run
	}
}

const exportsData = {
	config: config,
};


module.exports = exportsData;