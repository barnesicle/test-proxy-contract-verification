
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
	if (typeof mock.response === 'object') {
		res.send(mock.response)
	} else if (typeof mock.response === 'function') {
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

	const methods = mock.method.split(',');
	// TODO Validate
	return methods;
}


function isLearningMode(options) {
	return typeof options.learnMode !== 'undefined' && (options.learnMode === true || options.learnMode === 'true')
}

function isCacheMode(options) {
	return options.useCache === true;
}

function isUpdateCacheMode(options) {
	return options.updateCache === true;
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