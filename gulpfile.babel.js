import gulp from 'gulp';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import flow from 'gulp-flowtype';
import install from 'gulp-install';
import mocha from 'gulp-mocha';
import sourcemaps from 'gulp-sourcemaps';

const deps = [
  './package.json'
];

const source = [
  './src/**.es6',
  '!node_modules/**'
];

const tests = [
  './test/**.es6'
];

gulp.task('build', [
  'lint',
  'es6'
]);

gulp.task('dist', [
  'install',
  'build',
  'test'
]);

gulp.task('es6', () => {
  gulp.src(source)
    .pipe(sourcemaps.init())
    .pipe(flow({
      all: false,
      weak: false,
      killFlow: false,
      beep: true,
      abort: false
    }))
    .pipe(babel({
      ignore: 'gulpfile.babel.js'
    }))
    .pipe(gulp.dest('./lib'));
});

gulp.task('install', () => {
  gulp.src(deps)
    .pipe(install());
});

gulp.task('lint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  gulp.src(source)
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format());
});

gulp.task('test', () => {
  gulp.src(tests)
    // `gulp-mocha` needs filepaths so you can't have any plugins before it
    .pipe(mocha({
      require: [
        'babel-core/register'
      ]
    }));
});

// gulp.task('typecheck', () => {
//   gulp.src(source)
//     .pipe(babel({
//       ignore: 'gulpfile.babel.js'
//     }))
//     .pipe(gulp.dest('./lib'));
// });

gulp.task('watch', () => {
  gulp.watch([...source, ...tests], [
    'build',
    'test'
  ]);
});

// Default task
gulp.task('default', [
  'build',
  'watch'
]);

