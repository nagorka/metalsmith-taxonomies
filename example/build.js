var metalsmith = require('metalsmith');
var taxonomies = require('../lib');

metalsmith(__dirname)
	.source('src')
	.use(taxonomies([{
		pattern: 'challenges/*.md',
		name: 'challenges'
	}, {
		pattern: 'services/*.md',
		name: 'services'
	}]))
	.build(function(err) {
		console.log(err || 'success');
	});
