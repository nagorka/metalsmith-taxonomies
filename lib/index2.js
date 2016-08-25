var debug = require('debug')('metalsmith-taxonomies');
var minimatch = require('minimatch');
var Path = require('path');

module.exports = function(opt) {

	var options = opt || {};

	var taxonomies = Object.keys(options);

	debug('taxonomies: %s', taxonomies);

	return function(files, metalsmith, done) {

		setImmediate(done);

		// all the files
		var paths = Object.keys(files);
		var meta = metalsmith.metadata();
		var references = {};

		paths.forEach(function(path) {

			debug('process file %s', path);

			var file = files[path];

			taxonomies.filter(function(x) {

				var pattern = options[x].pattern;
				
				if (pattern && minimatch(path, pattern)) {
					
					var taxonomy = file.taxonomy = {name: file.taxonomy || Path.parse(path).name, files:[]};
					
					debug('%s is a taxonomy: %s', path, taxonomy.name);
					
					references[x] = references[x] || {};
					references[x][taxonomy.name] = references[x][taxonomy.name] || { src: null, refs: [] };
					references[x][taxonomy.name].src = path;
					references[x][taxonomy.name].refs.forEach(function(ref) {
						debug('replace %s with file object in %s for %s', taxonomy.name, x, ref);
						files[ref][x] = files[ref][x].map(function(tag) {
							return tag === taxonomy.name ? files[path] : tag;
						});
						taxonomy.files.push(files[ref]);
					});
				}

				return file[x];

			}).forEach(function(x) {
				references[x] = references[x] || {};
				var tags = Array.isArray(file[x]) ? file[x] : (typeof file[x] === 'string' ? file[x].replace(/\,/g, ' ').replace(/\s+/g, ' ').trim().split(' ') : []);
				file[x] = tags.map(function(tag) {
					references[x][tag] = references[x][tag] || { src: null, refs: []};
					references[x][tag].refs.push(path);
					
					var ret = tag;
					if (references[x][tag].src) {
						debug('add reference to %s in %s', path, references[x][tag].src);
						files[references[x][tag].src].taxonomy.files.push(files[path]);
						ret = files[references[x][tag].src];
					} 

					debug('%s in %s is %s', x, path, ret.title || ret);
					return ret;

				});
			});

			//debug(references);

		});

		meta.taxonomies = Object.keys(references).reduce(function(memo, t) {
			memo[t] = Object.keys(references[t]).filter(function(x) {
				var o = references[t][x];
				if (!o.src) {
					debug('filter out invalid tag %s', x, o.refs);
					o.refs.forEach(function(p) {
						files[p][t] = files[p][t].filter(tag => tag !== x);
					});
				}
				return o.src;
			});
			return memo;
		}, {});
		
	}

};