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
  DeviceEventEmitter,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

const {FFMPEGCommandline} = NativeModules;
const {width, height} = Dimensions.get('window');
const columns = 5
const itemWidth = width / columns;
const videoExt = ".mp4";
const savedFilePath = Directory.PICTOGRAM+"pictogram"+videoExt;
const TextToVideo = NativeModules.TextToVideo;

var counter = 0
var iconsDict = Platform.select({
  ios: () => icons,
  android: () => {}
});

DeviceEventEmitter
  .addListener('ffmpeg:message', (message) => {
    console.log('ffmpeg message', message)
  });

function moveToPictogramDir(file) {
  return new Promise((resolve, reject) => {
    
    RNFS.moveFile(file, savedFilePath)
      .then(() => {
        resolve()
      })
      .catch((error) => {
        reject(error)
      })
  });
}

function resetTextCache() {
  RNFS.unlink(Directory.TEXT)
    .catch((error) => {
      console.log("Couldn't delete text videos cache!", error);
    })
    .then(() => {
      RNFS.mkdir(Directory.TEXT)
        .then(() => {
          console.log("Text video cache directory reset!");
        })
        .catch((error) => {
          console.log(error);
        });
    });
}

function incrementalCounter() {
  return counter++
}

class HomeScreen extends React.Component {

  didFocusSubscription = this.props.navigation.addListener(
    'didFocus',
    payload => {
      resetTextCache();
    }
  );

  constructor(props) {
    super(props);

    this.state = {
      output: [],
      thumbnails: []
    };

    if (Platform.OS === 'android') {
      RNFS.copyFileAssets('fonts/Rubik-Regular.ttf', RNFS.DocumentDirectoryPath+'/Rubik-Regular.ttf')
      .then(() => {
        console.log("Moved font");
        RNFS.readDir(RNFS.DocumentDirectoryPath)
          .then(dir => {
            console.log("docDirPath:", dir);
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });

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
              this.state.thumbnails.push(item);
            }
          });
        })
    } else {
      Object.keys(icons).forEach(key => {
        const item = {key: incrementalCounter(), uri: icons[key], value: String(key)};
        this.state.thumbnails.push(item);
      });
    }
  }

  componentWillUnmount() {
    this.didFocusSubscription.remove();
  }

  renderText = (text, index) => {
    return new Promise((resolve, reject) => {
      const output = Directory.TEXT + "text_" + index + videoExt;
      text = text.replace(':', ';'); // Replace colon to semicolon since FFmpeg can't render regular colon

      // TODO: Fixa tiden texten visas
      FFMPEGCommandline.runCommand([
        '-f', 'lavfi',
        '-i', 'color=c=white:s=768x768:d=1.5',
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-vf', 'drawtext=fontfile=' + RNFS.DocumentDirectoryPath + '/Rubik-Regular.ttf:fontsize=48:'+
        "fontcolor=black:x=(w-text_w)/2:y=(h-text_h)/2:text='"+ text +"', format=yuv420p",
        '-shortest',
        '-video_track_timescale', '12800',
        '-c:v', 'mpeg4',
        '-hide_banner',
        output
      ])
      .then ((result) => {
        console.log ('result', result);
        resolve(output)
      })
      .catch ((err) => {
        console.error ('error', err);
        reject(err)
      });
    });
  }

  prepareAndMoveToPictogramDir = (file) => {
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

  /**
   *  Render text videos
   */
  prepareMerge = (inputArray) => {
    var promiseArray = []
    var parsedArray = inputArray.map((item, index) => {
        if (item.uri != null) {
          return Directory.VIDEO+item.value+videoExt
        } else {
          if (Platform.OS === 'android') {
            promiseArray.push(this.renderText(item.value+"", index+""));
          } else {
            promiseArray.push(TextToVideo.generateAsync(item.value+"", index+""));
          }
        }
        return Directory.TEXT+"text_"+index+videoExt
    });

    Promise.all(promiseArray).then((values) => {
      console.log(values);
      this.merge(parsedArray);
    });
  }

  merge = (inputArray) => {
    if (Platform.OS === 'android') {
      const output = Directory.TEXT + "result.mp4";
      const listLocation = RNFS.CachesDirectoryPath+"/ffmpeg-list.txt";

      let list = inputArray.map(item => { return `file ${item}` }).join('\n');
      console.log("FFMPEG LIST:", list);
      RNFS.writeFile(listLocation, list, 'utf8')
        .then((success) => {
          console.log('FILE WRITTEN!', success);

          FFMPEGCommandline.runCommand([
            '-f', 'concat',
            '-safe', '0',
            '-i', listLocation,
            '-c', 'copy',
            '-video_track_timescale', '12800',
            '-hide_banner',
            output
          ])
          .then(result => {
            console.log("Got merge result:", result);
            this.prepareAndMoveToPictogramDir(output);
          })
          .catch(error => {
            console.log("Could not merge:", error);
          });
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      RNVideoEditor.merge(inputArray,
        results => {
          console.log("Error: ", results);
        },
        (results, file) => {
          console.log("Got merged file:", file);
          this.prepareAndMoveToPictogramDir(file);
        }
      );
    }
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
    output.push({ key: incrementalCounter(), uri: null, value: text })
    this.setState({ output })
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
      android: item.uri != null ? {uri: item.uri} : require('../gui/textButton.png')
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
      <View style={styles.container}>
        <KeyboardAvoidingView style={styles.output} behavior="padding" enabled>
          <FlatList 
            extraData={this.state}
            numColumns={columns}
            data={this.state.output}
            renderItem={this.renderOutput}
          />
        </KeyboardAvoidingView>
        <KeyboardAvoidingView style={styles.keyboard} behavior="padding" enabled>
          <TextInput
            style={{height: 40, width: width, borderColor: 'green', borderWidth: 2}}
            onChangeText={(text) => this.setState({text})}
            value={this.state.text}
            returnKeyType={"done"}
            onSubmitEditing={() => this.addTextItem(this.state.text)}
            clearButtonMode='always'
            ref="myInput"
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
              <TouchableHighlight style={styles.bottomRight}
                onPress={ () => this.prepareMerge(this.state.output) }>
                <Image style={styles.image} source={require('../gui/renderButton.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight style={styles.bottomRight} onPress={() => this.prepareKeyboard()}>
                <Image style={styles.image} source={require('../gui/textButton.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight style={styles.bottomRight} onPress={() => this.removeLastItem()}>
                <Image style={styles.image} source={require('../gui/removeButton.png')} resizeMode='cover' />
              </TouchableHighlight>
            </View>
          </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  keyboard: {
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  output: {
    flex: 1,
    width: width,
    // maxHeight: itemWidth * 5
  },
  input: {
    width: width - itemWidth,
    height: itemWidth * 3,
    backgroundColor: 'powderblue'
  },
  bottomRight: {
  },
  image: {
  	height: itemWidth,
  	width: itemWidth
  },
  buttonColumn: {
    flex: 1,
    height: itemWidth*3,
    width: itemWidth
  },
  flexRight: {
    flex: 1,
    flexDirection: 'row',
  }
});

export default HomeScreen;