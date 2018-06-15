const fs = require('fs');
const icons = './icons/';
const videos = './videos/';

function inject(injection) {
	const text = fs.readFileSync('./components/HomeScreen.js','utf8')
	const reactNative = "'react-native';"
	const index = text.indexOf(reactNative) + reactNative.length + 1 
	const final = text.slice(0, index) + injection + text.slice(index, text.length)
	fs.writeFileSync('./components/HomeScreen.ios.js', final)
}

function dic(folder, dictionaryName) {
	return new Promise((resolve, reject) => {
		let injection = `const ${dictionaryName} = {`
		fs.readdir(folder, (err, files) => {

			files.forEach(file => {
				if (file[0] != '.') {
					injection += `'${file.slice(0,file.length-4)}': require('.${folder+file}'),\n`
				}
			});
			injection += "};"

			resolve(injection)
		})
	});
}

dic(icons, "icons").then((icons) => {
	dic(videos, "videos").then((videos) => {
		inject(icons+"\n"+videos)
	})
});
