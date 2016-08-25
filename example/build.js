var metalsmith = require('metalsmith');
var taxonomies = require('../lib/index2');

metalsmith(__dirname)
	.source('src')
	.use(taxonomies({
		challenges: {
			pattern: 'challenges/*.md',
		},
		services: {
			pattern: 'services/*.md'
		}
	}))
	.build(function(err) {
		console.log(err || 'success');
	});
