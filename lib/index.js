var debug = require('debug')('metalsmith-taxonomies');
var minimatch = require('minimatch');
var Path = require('path');
var Matcher = minimatch.Minimatch;

module.exports = function(opt) {

	var options = opt || {};

	return function(files, metalsmith, done) {

		// get all the paths
		var paths = Object.keys(files);

		// get the global metadata
		var meta = metalsmith.metadata();

		meta.taxonomies = meta.taxonomies || {};

		var taxonomy = options;

		debug('Processing taxonomy', taxonomy);

		// ignore if the pattern isn't defined
		// or the taxonomy name isn't specified
		// or the the name already been processed
		if (!taxonomy.pattern || !taxonomy.name || meta.taxonomies[taxonomy.name]) {
			debug('Ignoring taxonomy');
			return;
		}

		var matcher = new Matcher(taxonomy.pattern);

		// loop through all the files
		paths.forEach(function(path) {

			// check if the file matches the pattern
			var isMatch = matcher.match(path);

			if (!isMatch) {
				return;
			}

			debug('Processing file: %s', path);

			var file = files[path];

			// set the taxonomy object
			file.taxonomy = {
				name: file.taxonomy || Path.parse(path).name,
				files: []
			};

			// set the path
			file.path = path;

			debug('taxonomy name: %s', file.taxonomy.name);

			// add the taxonomy and the file to the global metadata
			meta.taxonomies[taxonomy.name] = meta.taxonomies[taxonomy.name] || [];
			meta.taxonomies[taxonomy.name].push(file);

		});

		// loop through all files that isn't a taxonomy
		// and check if it references a taxonomy
		paths.forEach(function(path) {

			var file = files[path];

			if (file.taxonomy || !file[taxonomy.name])
				return;

			debug('Found taxonomy %s in file %s: %s', taxonomy.name, path, file[taxonomy.name]);
			var items = file[taxonomy.name];

			var isString = typeof items === 'string';
			if (!Array.isArray(items) && !isString) {
				delete file[taxonomy.name];
				return;
			}

			if (isString) {
				items = items.replace(/\,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
			}

			debug('items: %s', items);

			var validItems = meta.taxonomies[taxonomy.name].reduce(function(memo, item) {
				memo[item.taxonomy.name] = item;
				return memo;
			}, {});

			items = items.filter(function(item) {
				var isValid = validItems[item]
				if (!isValid) {
					debug('removing invlid item: %s', item);
				}
				return isValid;
			}).map(function(item) {

				taxonomyFile = validItems[item];

				// the 'file' has a reference
				// to 'taxonomyFile' taxonomy
				// add 'file' to the files property of that taxonomy

				debug('add reference to %s from %s page', file.title, taxonomyFile.title);

				taxonomyFile.taxonomy.files.push(file);

				return taxonomyFile;
			});

			if (!items.length) {
				return;
			} 

			file[taxonomy.name] = items;
			file.path = path;

		});

		debug('metadata', meta);

		done();

	};

};
