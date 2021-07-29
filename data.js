const { expect } = require('chai');

const mockEndpoints = [
	{
		path: '/payments/payment-methods',
		methods: 'get',
		response: {
			"paymentMethods": [
				{
					"type": "alipay",
					"flow": "redirect",
					"supportsRecurring": false,
					"supportsFreeTrial": false,
					"images": {
						"iconImage": "https://mylogos.com/alipay.png"
					},
					"supportsStorage": false
				}
			]
		},
		transformRequest: function (req) {
			return '';
		},
		transformResponse: function (req) {
			return '';
		},
		assertions: { // TODO Could be an object or a function
			//body: {},
			statusCode: 201
		}
	},
	{
		path: '/payments/sources',
		method: 'post',
		response: {
			"paymentMethods": [
				{
					"type": "alipay",
					"flow": "redirect",
					"supportsRecurring": false,
					"supportsFreeTrial": false,
					"images": {
						"iconImage": "https://mylogos.com/alipay.png"
					},
					"supportsStorage": false
				}
			]
		},
		transformRequest: function (req) {
			return '';
		},
		state: {
			occurrances: 1
		},
		transformResponse: {
			task: function (req, apiResponseBody, state) {
				//console.log('transformResponse', apiResponseBody)
				if (state.occurrances === 1) {
					apiResponseBody.clientSecret = 'f3218b36-cc93-4a23-b2ed-cb095cc0ca6c_c2bf1d9e-a5d5-48e2-adfb-8be06c68c752';
					apiResponseBody.state = 'requires_action'
					apiResponseBody.nextAction = {
						action: 'challenge_shopper',
						data: {
							challengeToken: 'eyJhY3NSZWZlcmVuY2VOdW1iZXIiOiJBRFlFTi1BQ1MtU0lNVUxBVE9SIiwiYWNzVHJhbnNJRCI6IjcyNjRiM2I0LTVmMWItNDEzYS1iNjMyLTk0OWZiMDgyMGM3MSIsImFjc1VSTCI6Imh0dHBzOlwvXC9wYWwtdGVzdC5hZHllbi5jb21cL3RocmVlZHMyc2ltdWxhdG9yXC9hY3NcL2NoYWxsZW5nZS5zaHRtbCIsIm1lc3NhZ2VWZXJzaW9uIjoiMi4xLjAiLCJ0aHJlZURTTm90aWZpY2F0aW9uVVJMIjoiaHR0cHM6XC9cL2NoZWNrb3V0c2hvcHBlci10ZXN0LmFkeWVuLmNvbVwvY2hlY2tvdXRzaG9wcGVyXC8zZG5vdGlmLnNodG1sP29yaWdpbktleT1wdWIudjIuODExNTA2MTE1NzU5MDA1OC5hSFIwY0hNNkx5OXFjeTEwWlhOMExtUnBaMmwwWVd4eWFYWmxjaTVqYjIwLnF5NWtydF9Gd1NIbUVjZDZoSkVWM0F3QVNkbWdVTGR3Q0VTdEpoeFZnemsiLCJ0aHJlZURTU2VydmVyVHJhbnNJRCI6Ijc5MDUzNmQ4LWNjMDQtNGRhOC1hMDhkLTY2ZWE4NzJlNGU4OCJ9'
						}
					};
					// TODO Add toke and all that stuff
				} else {
					console.log('transformResponse SKIPPING', state.occurrances)
				}
				return apiResponseBody;
			}
		},
		assertions: {
			statusCode: 201
		}
	},
]

module.exports = mockEndpoints;