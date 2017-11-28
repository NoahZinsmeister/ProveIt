var fs = require('fs');
var browserify = require('browserify');
var b = browserify(opts={standalone: "browserifyModules"});
b.add('./modules.js');
b.bundle().pipe(fs.createWriteStream(__dirname + '/bundle.js'));
