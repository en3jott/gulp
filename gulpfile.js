// path 
let project = 'build';
let source = 'src';
let node = 'node_modules';

let path = {
		build: {
			html: project + '/',
			css: project + '/css/',
			js: project + '/js/',
			img: project + '/img/',
			svg: project + '/img/svg/',
			fonts: project + '/fonts/',
		},
		src: {
			html: [source + '/*.html', '!' + source + '/_*.html'],
			scss: source + '/scss/style.scss',
			css: source + '/css/',
			js: source + '/js/*.js',
			img: source + '/img/**/*.+(png|jpg|jpeg|ico|webp|gif)',
			svg: source + '/img/svg/*.svg',
			fonts: source + '/fonts/**/*.*',
		},
		watch: {
			html: source + '/**/*.html',
			css: source + '/scss/**/*.scss',
			js: source + '/js/**/*.js',
			img: source + '/img/**/*.+(png|jpg|jpeg|ico|webp|gif)',
			svg: source + '/img/svg/*.svg',
			fonts: source + '/fonts/**/*.*',
		},
		clean: './' + project + '/',
}

//gulp settings
const { src, 
				dest, 
				watch, 
				parallel, 
				series } 	= require('gulp');
const include 		= require('gulp-file-include');
const bs 					= require('browser-sync').create();
const scss 				= require('gulp-sass')(require('sass'));
const prefixer 		= require('gulp-autoprefixer');
const cleanStyle 	= require('gulp-clean-css');
const concat 			= require('gulp-concat');
const rename 			= require("gulp-rename");
const uglify 			= require('gulp-uglify-es').default;
const imagemin    = require('gulp-imagemin');
const del 				= require('del'); 
const prettier    = require('gulp-prettier');
const svgmin      = require('gulp-svgmin');
const cheerio     = require('gulp-cheerio');
const replace     = require('gulp-replace');
const sprite      = require('gulp-svg-sprite');
const chalk 			= require('chalk');
const reload      = bs.reload;

//plugins array 
const plugins_style = [];
const plugins_script = [];

//browserSync function
function browsersync(params) {
	bs.init({
			server: {
				baseDir: './' + project + '/',
			}
	});
}

//clean fucntion
function clean() {
	return del(path.clean)
}

//html function
function html() {
	return src(path.src.html)
				.pipe(include({
					prefix: '@@'
					}))
				.pipe(prettier({ singleQuote: false }))
				.pipe(dest(path.build.html))
				.pipe(reload({stream: true}))
}

//styles function 
function styles() {
	return src(path.src.scss)
				.pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
				.pipe(prefixer({
					grid: true,
					overrideBrowserslist: ['last 10 version'],
					cascade: false,
					browsers: [
						'Android >= 4',
						'Chrome >= 20',
						'Firefox >= 24',
						'Explorer >= 11',
						'iOS >= 6',
						'Opera >= 12',
						'Safari >= 6',
					],
				}))
				.pipe(cleanStyle({
					level: 2
				}))
				.pipe(concat('style.css'))
				.pipe(rename({
					extname: '.min.css',
				}))
				.pipe(dest(path.build.css))
				.pipe(dest(path.src.css))
				.pipe(reload({stream: true}))
}

//libs_style fucntion 
function libs_style(done) {
	if (plugins_style.length > 0) {
		return src(plugins_style)
					.pipe(scss({
						outputStyle: 'compressed'
					}).on('error', scss.logError))
					.pipe(concat('libs.min.css'))
					.pipe(dest(path.build.css))
					.pipe(dest(path.src.css))
	} else {
		return done(console.log(chalk.redBright('No added CSS/SCSS plugins')));
	}
}

//scripts function 
function scripts() {
	return src(path.src.js)
				.pipe(concat('main.js'))
				.pipe(uglify())
				.pipe(rename({
					extname: '.min.js',
				}))
				.pipe(dest(path.build.js))
				.pipe(reload({stream: true}))
}

//libs_style fucntion 
function libs_script(done) {
	if (plugins_script.length > 0) {
		return src(plugins_script)
					.pipe(concat('libs.js'))
					.pipe(uglify())
					.pipe(rename({
						extname: '.min.js',
					}))
					.pipe(dest(path.build.js))
	} else {
		return done(console.log(chalk.redBright('No added JS plugins')));
	}
}

//images function
function images() {
	return src(path.src.img) 
				.pipe(imagemin([
					imagemin.gifsicle({interlaced: true}),
					imagemin.mozjpeg({quality: 75, progressive: true}),
					imagemin.optipng({optimizationLevel: 5}),
					imagemin.svgo({
						plugins: [
							{removeViewBox: true},
							{cleanupIDs: false}
						]
					})
				]))
				.pipe(dest(path.build.img))
				.pipe(reload({stream: true}))
}

//fonts function
function fonts() {
	return src(path.src.fonts)
				.pipe(dest(path.build.fonts))
				.pipe(reload({stream: true}))
}

//svg sprite function 
function svg() {
	return src(path.src.svg)
            .pipe(svgmin({
                js2svg: {
                    pretty: true
                }
            }))
            .pipe(cheerio({
                run: function ($) {
                    $('[fill]').removeAttr('fill');
                    $('[stroke]').removeAttr('stroke');
                    $('[style]').removeAttr('style');
                },
                parserOptions: {
                    xmlMode: true
                }
            }))
            .pipe(replace('&gt;', '>'))
            .pipe(sprite({
                mode: {
                    symbol: {
                        sprite: "../sprite.svg",
                    }
                }
            }))
            .pipe(dest(path.build.svg));
}

//watching function
function watching(params) {
	watch([path.watch.html], html)
	watch([path.watch.css], styles)
	watch([path.watch.js], scripts)
	watch([path.watch.img], images)
	watch([path.watch.svg], svg)
	watch([path.watch.fonts], fonts)
}

//export function 
exports.html        = html;
exports.styles      = styles;
exports.libs_style  = libs_style;
exports.scripts     = scripts;
exports.libs_script = libs_script;
exports.images      = images;
exports.fonts       = fonts;
exports.svg         = svg;
exports.watching    = watching;
exports.clean       = clean;
exports.browsersync = browsersync;

exports.build       = series(clean, parallel(html, styles, libs_style, scripts, libs_script, images, svg, fonts))
exports.default     = parallel(html, styles, libs_style, scripts, libs_script, images, svg, fonts, browsersync, watching)