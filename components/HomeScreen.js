import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Image,
  TouchableHighlight,
  Dimensions,
  NativeModules,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

const {width, height} = Dimensions.get('window');
const columns = 7
const itemWidth = width / columns;
const videoExt = ".mp4";
const savedFilePath = Directory.PICTOGRAM+"pictogram"+videoExt;
const TextToVideo = NativeModules.TextToVideo;

var counter = 0
var iconsDict = Platform.select({
  ios: () => icons,
  android: () => {}
});

function moveToPictogramDir(file) {
  return new Promise((resolve, reject) => {
    
    RNFS.moveFile(file, savedFilePath)
      .then(() => {
        resolve()
      })
      .catch((error) =>{
        reject(error)
      })
  });
}

function incrementalCounter() {
  return counter++
}

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    var thumbnails = [];

    if (Platform.OS === 'android') {
      RNFS.readDir(Directory.ICON)
        .then(dir => {
          console.log('GOT RESULT dir:', dir);
          dir.forEach(icon => {
            if (icon.name[0] != '.') {
              const item = {
                key: incrementalCounter(),
                uri: "file://"+icon.path,
                value: icon.name.slice(0,icon.name.length-4)
              };
              thumbnails.push(item);
            }
          });
          console.log('GOT RESULT thumbnails:', thumbnails);

          // state is set asynchronously
          this.state = {
            output: [],
            thumbnails: thumbnails
          };
        })
    } else {
      Object.keys(icons).forEach(key => {
        const item = {key: incrementalCounter(), uri: icons[key], value: String(key)};
        thumbnails.push(item);
      });
    }

    this.state = {
      output: [],
      thumbnails: thumbnails
    };
  }

  prepareMerge = (inputArray) => {

    var promiseArray = []
    var parsedArray = inputArray.map((item, index) => {
        if (item.uri != null) {
          return Directory.VIDEO+item.value+videoExt
        } else {
          promiseArray.push(TextToVideo.generateAsync(item.value+"", index+""))
          return Directory.TEXT+"/text_"+index+".mp4"
        }
    });

    Promise.all(promiseArray).then((values) => {
      console.log(values);
      this.merge(parsedArray);
    });
  }

  merge = (inputArray) => {
		RNVideoEditor.merge(inputArray,
		  results => {
		    console.log("Error: ", results);
		  },
		  (results, file) => {
		  	console.log("Got merged file:", file);
		    RNFS.exists(Directory.PICTOGRAM)
		      .then(pictogramDirExists => {
		        if (!pictogramDirExists) {
		          RNFS.mkdir(Directory.PICTOGRAM)
		            .then(() => {
		              moveToPictogramDir(file)
		                .then(() => {
		                  this.props.navigation.navigate('Result');
		                })
		            })
		        } else {
		          moveToPictogramDir(file)
		            .then(() => {
		              this.props.navigation.navigate('Result');
		            }).catch((error) => {
		            	console.log("Could not move to pictogram directory: ", error);
		            	RNFS.unlink(savedFilePath).then(() => {
		            		moveToPictogramDir(file).then(() => {
		            			console.log("Great success");
		            			this.props.navigation.navigate('Result');
		            		})
		            	})
		            })
		        }
		      })
		      .catch((error) => {
          	console.log("Pictogram dir exist check error: ", error);
          });
			 }
		);
	}

  addItem = (item) => {
    output = this.state.output
    output.push(item)
    this.setState({ output })
  };

  prepareKeyboard = () => {
    this.refs["myInput"].focus()
  };

  addTextItem = (text) => {
    output = this.state.output
    output.push({key:incrementalCounter(), uri:null, value: text})
    this.setState({ output })
    this.setState({ text: null })
  };

  removeLastItem = () => {
    RNFS.readDir(RNFS.CachesDirectoryPath).then((result) => {
      console.log('GOT RESULT', result);
    })

    output = this.state.output
    if (output.length > 0) {
      output.pop()
    }
    this.setState({ output })
  };

  renderOutput = ({item}) => {
    let source = Platform.select({
      ios: item.uri != null ? item.uri : require('../gui/textButton.png'),
      android: {uri: item.uri}
    });
    return (
      <View>
        <Image style={styles.image}
        source={source}
        resizeMode='cover' />
      </View>
    )
  };

  renderInput = ({item}) => {
    let source = Platform.select({
      ios: item.uri,
      android: {uri: item.uri}
    });
    return (
      <TouchableHighlight onPress={() => this.addItem(item)}>
        <Image style={styles.image}
        source={source}
        resizeMode='cover' />
      </TouchableHighlight>
    )
  };

  render() {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.output}>
            <FlatList 
              extraData={this.state}
              numColumns={columns}
              data={this.state.output}
              renderItem={this.renderOutput}
            />
          </View>
          <KeyboardAvoidingView style={styles.textInputContainer} behavior="position" enabled>
            <TextInput
            style={styles.textInput}
            onChangeText={(text) => this.setState({text})}
            value={this.state.text}
            returnKeyType={"done"}
            onSubmitEditing={() => this.addTextItem(this.state.text)}
            // clearButtonMode='always'
            ref="myInput"
            maxLength = {45}
            numberOfLines = {2}
          />
          </KeyboardAvoidingView>
          <View style={styles.flexRight}>
            <View style={styles.input}>
              <FlatList
                numColumns={columns}
                data={this.state.thumbnails}
                renderItem={this.renderInput}
              />
            </View>
            <View style={styles.buttonColumn}>
                <TouchableHighlight style={styles.image}
                  onPress={ () => this.prepareMerge(this.state.output) }>
                  <Image style={styles.image} source={require('../gui/renderButton.png')} resizeMode='cover' />
                </TouchableHighlight>
                <TouchableHighlight style={styles.image} onPress={() => this.prepareKeyboard()}>
                  <Image style={styles.image} source={require('../gui/textButton.png')} resizeMode='cover' />
                </TouchableHighlight>
                <TouchableHighlight style={styles.image} onPress={() => this.removeLastItem()}>
                  <Image style={styles.image} source={require('../gui/removeButton.png')} resizeMode='cover' />
                </TouchableHighlight>
              </View>
            </View>
        </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  textInputContainer: {
    height: 100,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  textInput: {
    height: 100,
    width: width,
    fontSize: 32,
    fontFamily: 'Rubik-Regular'
  },
  output: {
    flex: 1,
    width: width,
    flexGrow: 1,
  },
  input: {
    width: width - itemWidth,
    height: itemWidth * 3,
  },
  bottomRight: {
  },
  image: {
  	height: itemWidth,
  	width: itemWidth,
  },
  buttonColumn: {
    height: itemWidth*3,
    width: itemWidth
  },
  flexRight: {
    flexDirection: 'row',
  }
});

export default HomeScreen;