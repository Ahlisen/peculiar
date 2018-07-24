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
  DeviceEventEmitter
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

const {FFMPEGCommandline} = NativeModules;
const {width, height} = Dimensions.get('window');
const columns = 5
const rows = 4
const itemWidth = width / columns;
const videoExt = ".mp4";
const pictogramResultPath = Directory.PICTOGRAM+"pictogram"+videoExt;

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
    
    RNFS.moveFile(file, pictogramResultPath)
      .then(() => {
        resolve()
      })
      .catch((error) => {
        reject(error)
      })
  });
}

function resetTextCache() {
  RNFS.unlink(Directory.TEXTVIDEO)
      .catch((error) => {
        console.log("Couldn't delete text videos cache!", error);
      })
      .then(() => {
        RNFS.mkdir(Directory.TEXTVIDEO)
          .then(() => {
            console.log("Text video cache directory reset!");
          })
          .catch((error) => {
            console.log(error);
          });
      });
}

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    resetTextCache();

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
                key: icon.name.slice(0,icon.name.length-4),
                uri: "file://"+icon.path
              };
              this.state.thumbnails.push(item);
            }
          });
        })
    } else {
      Object.keys(icons).forEach(key => {
        const item = {key: String(key), uri: icons[key]};
        this.state.thumbnails.push(item);
      });
    }
  }

  renderText = (outputDirs) => {
    return new Promise((resolve, reject) => {
      const output = Directory.TEXTVIDEO + 'text.mp4';

      FFMPEGCommandline.runCommand ([
        '-f', 'lavfi',
        '-i', 'color=c=white:s=768x768:d=1.5',
        '-f', 'lavfi',
        '-i', 'anullsrc',
        '-vf', 'drawtext=fontfile='+RNFS.DocumentDirectoryPath+'/Rubik-Regular.ttf:fontsize=48:'+
        'fontcolor=black:x=(w-text_w)/2:y=(h-text_h)/2:text=\'Pictograaaaaaeeeeuuummmm!\nHEllo thEre.\''+
        ', format=yuv420p',
        '-shortest',
        output
      ])
      .then ((result) => {
        console.log ('result', result);
        outputDirs.push({
          key: 'text',
          uri: output
        });
        resolve(outputDirs)
      })
      .catch ((err) => {
        console.error ('error', err);
        reject()
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
              RNFS.unlink(pictogramResultPath).then(() => {
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

  merge = (inputArray) => {
    let output = Directory.TEXTVIDEO + "result.mp4";
    let command = inputArray.reduce((acc, item) => acc.push(...['-i', item]) && acc, []);

    if (Platform.OS === 'android') {
      let trackMappings = "";
      for (let i = 0; i < inputArray.length; i++) {
        trackMappings += `[${i}:v] [${i}:a] `;
      };
      trackMappings += `concat=n=${inputArray.length}:v=1:a=1 [v] [a]`;
      command.push(...["-filter_complex", trackMappings, "-map", "[v]", "-map", "[a]", "-preset", "ultrafast", output]);
      console.log("Running command:", command);

      FFMPEGCommandline.runCommand(command)
        .then(result => {
          console.log("Got merge result:", result);
          this.prepareAndMoveToPictogramDir(output);
        })
        .catch(error => {
          console.log("Could not merge.");
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

  removeLastItem = () => {
    output = this.state.output
    if (output.length > 0) {
      output.pop()
    }
    this.setState({ output })
  };

  renderOutput = ({item}) => {
    let source = Platform.select({
      ios: item.uri,
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
      <View style={styles.container}>
        <View style={styles.output}>
          <FlatList 
            extraData={this.state}
            numColumns={columns}
            data={this.state.output}
            renderItem={this.renderOutput}
          />
          <TouchableHighlight style={styles.bottomRight}
          	onPress={
          		() => {
                this.renderText(this.state.output)
                  .then(output => {
                    
                    RNFS.readDir(Directory.TEXTVIDEO)
                      .then(dir => {
                        console.log("dir:", dir)
                      })
                      .catch(e => {
                        console.log(e)
                      });

                    this.merge(
                      output.map((item) => {
                        if (item.key.startsWith("text")) {
                          return Directory.TEXTVIDEO+item.key+videoExt
                        } else {
                          return Directory.VIDEO+item.key+videoExt
                        }
                      })
                    );

                  })
                  .catch((error) => {
                    console.log("Couldn't render text / merge", error);
                    this.merge(
                      this.state.output.map((item) => {
                        if (item.key.startsWith("text")) {
                          return RNFS.CachesDirectoryPath+item.key+videoExt
                        } else {
                          return Directory.VIDEO+item.key+videoExt
                        }
                      })
                    );
                  });
              }
          	}>
            <Image style={styles.image} source={require('../gui/render.png')} resizeMode='cover' />
          </TouchableHighlight>
        </View>
        <View style={styles.input}>
          <FlatList
            numColumns={columns}
            data={this.state.thumbnails}
            renderItem={this.renderInput}
          />
          <TouchableHighlight style={styles.bottomRight} onPress={() => this.removeLastItem()}>
            <Image style={styles.image} source={require('../gui/remove.png')} resizeMode='cover' />
          </TouchableHighlight>
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
  output: {
    position: 'relative',
    width: width,
    height: itemWidth * rows
  },
  input: {
    position: 'relative',
    width: width,
    height: itemWidth * rows
  },
  bottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0
  },
  image: {
  	height: itemWidth,
  	width: itemWidth
  }
});

export default HomeScreen;