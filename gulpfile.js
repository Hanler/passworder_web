let projectFolder = "dist"; // папка для заказчика
let sourceFolder = "#src"; // папка разработчика

let fs = require('fs');

let path = {
	//Пути, куда галп будет ВЫГРУЖАТЬ файлы
	build: {
		html: projectFolder + '/',
		css: projectFolder + '/css/',
		js: projectFolder + '/js/',
		img: projectFolder + '/img/',
		fonts: projectFolder + '/fonts/'
	},
	//Пути, откуда галп будет БРАТЬ файлы
	src: {
		html: [sourceFolder + '/*.html', "!" + sourceFolder + '/_*.html'],
		css: sourceFolder + '/scss/*.scss',
		js: sourceFolder + '/js/main.js',
		img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
		fonts: sourceFolder + '/fonts/**/*.ttf'
	},
	//Пути к папкам, которые будет галп все время слушать
	watch: {
		html: sourceFolder + '/**/*.html',
		css: sourceFolder + '/scss/**/*.scss',
		js: sourceFolder + '/js/**/*.js',
		img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
	},
	clean: './' + projectFolder + '/'
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require('browser-sync'),
	del = require('del'),
	sass = require('gulp-sass')(require('sass')),
	auto_prefixer = require('gulp-autoprefixer'),
	groupmedia = require('gulp-group-css-media-queries'),
	cleancss = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default,
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	fonter = require('gulp-fonter'),
	fileinclude = require('gulp-file-include');


function browserSync() {
	browsersync.init({
		server: {
			baseDir: "./" + projectFolder + "/"
		},
		port: 3000,
		notify: false,
	})
}

function fonts() {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

function img() {
    return src(path.src.img)
        /*.pipe(imagemin())*/
        .pipe(dest(path.build.img));
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(
			uglify()
		)
		.pipe(
			rename({
				extname: ".min.js"
			}))
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

function css() {
	return src(path.src.css)
		.pipe(
			sass({
				outputStyle: "expanded"
			})
		)
		.pipe(groupmedia())
		.pipe(
			auto_prefixer({
				overrideBrowserslist: ["last 5 versions"],
				cascade: true
			})
		)
		.pipe(dest(path.build.css))
		.pipe(cleancss())
		.pipe(rename({
			extname: ".min.css"
		}))
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

function fontsStyle(params) {
	let file_content = fs.readFileSync(sourceFolder + '/scss/_fonts.scss');
	if (file_content == '') {
		fs.writeFile(sourceFolder + '/scss/_fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(sourceFolder + '/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function cb() { }

function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], img); //new
}

function clean() {
	return del(path.clean)
}

gulp.task('otf2ttf', function () {
	return src([sourceFolder + '/fonts/*.otf'])
		.pipe(
			fonter({
				formats: ['ttf']
			})
		)
		.pipe(dest(sourceFolder + '/fonts/'))
})

let build = gulp.series(clean, gulp.parallel(js, css, html, fonts, img), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.img = img;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;