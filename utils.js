const { expect } = require('chai');

function isJson(actualResponseBody) {
	return actualResponseBody.startsWith('{') || actualResponseBody.startsWith('[');
}

function validateMock(mock, response, actualResponseBody) {
	if (typeof mock.assertions !== 'undefined' && typeof mock.assertions.statusCode !== 'undefined') {
		expect(response.status).equal(mock.assertions.statusCode);
	}
	if (typeof mock.assertions !== 'undefined' && typeof mock.assertions.body !== 'undefined') {

		if (typeof mock.assertions.body === 'object') {
			expect(actualResponseBody).equal(mock.assertions.body);
		} else if (typeof mock.assertions.body === 'function' && typeof actualResponseBody === 'string' && isJson(actualResponseBody)) {
			mock.assertions.body(JSON.parse(actualResponseBody));
		} else if (typeof mock.assertions.body === 'function' && typeof actualResponseBody === 'object') {
			mock.assertions.body(actualResponseBody);
		}

	}
}


function addMockResponse(mock, res, req) {
	console.log(' mock.response',  mock.response)
	if (typeof mock.response === 'object') {
		console.log('Added mock response')
		res.send(mock.response)
	} else if (typeof mock.response === 'function') {
		console.log('Added mock response')
		res.send(mock.response(req))
	}
}

function getCopyToCensor(body) {
	try {
		if (body === '' || body === '{}') {
			return body;
		} else if (typeof body === 'string') {
			return Object.assign({}, JSON.parse(body));
		} else {
			return Object.assign({}, body);
		}
	} catch (e) {
		return body;
	}
}

function censorBody(body) {

	const copy = getCopyToCensor(body);

	Object.keys(copy).forEach(key => {
		if (key === 'password') {
			(copy)[key] = '********';
		}
	});

	return JSON.stringify(copy);
}


function methods(mock) {

	if (typeof mock.method === 'undefined') {
		return ['all'];
	}

	return mock.method.split(',');
}


function isLearningMode(options) {
	return typeof options.learnMode !== 'undefined' && options.learnMode === 'true'
}

function isCacheMode(options) {
	return options.cacheMode === 'true';
}

function isUpdateCacheMode(options) {
	return options.updateCache === 'true';
}

function createObjectToSave(req, body, response) {
	return {
		invalidated: false,
		path: req.path,
		method: req.method,
		response: body,
		params: req.params,
		assertions: {
			statusCode: response.status
		},
		durations: {
			min: 0,
			max: 0,
			average: 0
		}
		// TODO Add the duration. Then when writing calculate the min, average, max
	};
}

const exportsData = {
	createObjectToSave,
	isUpdateCacheMode,
	isCacheMode,
	isLearningMode,
	methods,
	censorBody,
	addMockResponse,
	validateMock
};


module.exports = exportsData;