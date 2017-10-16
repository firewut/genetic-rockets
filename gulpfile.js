var gulp = require("gulp");
var watch = require("gulp-watch");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");

var paths = {
    pages: ['src/*.html']
};

gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("dist"));
});

gulp.task("typescript", ["copy-html"], function () {
    return browserify({
        basedir: '.',
        debug: true,
        entries: [
          './src/main.ts'
        ],
        cache: {},
        packageCache: {}
    })
    .plugin(tsify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("watch", function() {
    gulp.watch("src/*.ts", ["typescript"]);
    gulp.watch("src/*.html", ["copy-html"]);
})

gulp.task("default",["typescript", "watch"]);
