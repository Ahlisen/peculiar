import React, { Component } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableHighlight,
  Dimensions,
  NativeModules,
  DeviceEventEmitter,
  TextInput,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

String.prototype.insert = function (index, string) {
  return this.substring(0, index) + string + this.substring(index, this.length);
};

const {FFMPEGCommandline} = NativeModules;
const TextToVideo = NativeModules.TextToVideo;
const {width, height} = Dimensions.get('window');
const columns = 6
const itemWidth = width / (columns + 1);
const videoExt = ".mp4";
const savedFilePath = Directory.PICTOGRAM+"pictogram"+videoExt;
const textInputHeight = 70;
const inputRows = 3;
const genderArray = ["m/","h/","w/"];

// Loading animation
const spinValue = new Animated.Value(0);
const spin = spinValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg']
});

// Blinking animation
const blinkValue = new Animated.Value(0);
const blink = blinkValue.interpolate({
  inputRange: [0, 0.49, 0.5, 1],
  outputRange: [0, 0, 1, 1]
});

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

  willFocusSubscription = this.props.navigation.addListener(
    'willFocus',
    payload => {
      resetTextCache();
      
      resetOutput = this.props.navigation.getParam('reset', false);
      if (resetOutput) {
        this.setState({ output: [] });
        this.props.navigation.setParams({ 'reset': false });
      }
    }
  );

  loadAnimation = Animated.loop(
    Animated.timing(
      spinValue,
      {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      }
    )
  );

  caretAnimation = Animated.loop(
    Animated.timing(
      blinkValue,
      {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      }
    )
  );

  constructor(props) {
    super(props);

    this.state = {
      output: [],
      thumbnails: [],
      loading: false,
      usingKeyboard: false,
      gender: 1
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

    } else {
      Object.keys(icons).forEach(key => {
        const item = {key: incrementalCounter(), uri: icons[key], value: String(key)};

        if (!/(m|w)01/.test(item.value.split("_")[1])) {
          this.state.thumbnails.push(item);
        }

      });
    }

    this.caretAnimation.start();
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      RNFS.readDir(Directory.ICON)
        .then(dir => {
          dir.sort((a, b) => {
            var textA = a.name.toLowerCase();
            var textB = b.name.toLowerCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });

          let items = dir.map(icon => {
            return {
              key: incrementalCounter(),
              uri: "file://"+icon.path,
              value: icon.name.slice(0,icon.name.length-4)
            };
          });

          this.setState({ thumbnails: items });
        });
    }
  }

  componentWillUnmount() {
    this.willFocusSubscription.remove();
  }

  navigateToResult = () => {
    const { navigation } = this.props;
    navigation.navigate('Result', { homeRoute: navigation.state });
  }

  renderText = (text, index) => {
    return new Promise((resolve, reject) => {
      const output = Directory.TEXT + "text_" + index + videoExt;
      text = text.replace(':', ';'); // Replace colon to semicolon since FFmpeg can't render regular colon

      // Add line breaks to long strings
      const rowLength = 18;
      const textLength = text.length;
      if (textLength > rowLength) {
        text = text.insert(rowLength, '\n\n');
        if (textLength > rowLength*2) {
          text = text.insert(rowLength*2 + 2, '\n\n');
        }
      }

      const sizeModifier = textLength < 18 ? 192 - Math.max((textLength-2), 0) * 8 : 192 - 16 * 8;
      const fontSize = Math.max(sizeModifier, 32);
      const duration = Math.max(Math.min(textLength * 0.2, 1.8), 0.4);

      // TODO: Fixa tiden texten visas
      FFMPEGCommandline.runCommand([
        '-f', 'lavfi',
        '-i', 'color=c=white:s=768x768:d='+duration,
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
        '-vf', 'drawtext=fontfile='+RNFS.DocumentDirectoryPath+'/Rubik-Regular.ttf:fontsize='+fontSize+
        ":fontcolor=black:x=(w-text_w)/2:y=(h-text_h)/2:text='"+text+"', format=yuv420p",
        '-shortest',
        '-video_track_timescale', '12800',
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
    this.loadAnimation.stop();
    this.setState({loading: false})

    RNFS.exists(Directory.PICTOGRAM)
      .then(pictogramDirExists => {
        if (!pictogramDirExists) {
          RNFS.mkdir(Directory.PICTOGRAM)
            .then(() => {
              moveToPictogramDir(file)
                .then(() => {
                  this.navigateToResult();
                })
            })
        } else {
          moveToPictogramDir(file)
            .then(() => {
              this.navigateToResult();
            }).catch((error) => {
              console.log("Could not move to pictogram directory: ", error);
              RNFS.unlink(savedFilePath).then(() => {
                moveToPictogramDir(file).then(() => {
                  console.log("Great success");
                  this.navigateToResult();
                })
              })
            })
        }
      })
      .catch((error) => {
        console.log("Pictogram dir exist check error: ", error);
      });
  }

  checkViability = (inputArray) => {
    if (inputArray.length > 0 && this.state.loading == false) {
      this.loadAnimation.start();
      this.setState({loading: true})
      this.renderTextVideos(inputArray)
    }
  }

  renderTextVideos = (inputArray) => {
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

    //Add credits snippet to end
    parsedArray.push(Directory.VIDEO+"_CREDITS"+videoExt);

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

  setGender = (gender) => {
    this.setState({ gender:gender })
  }

  addItem = (item) => {
    output = this.state.output
    let genderArray = ["m01","h01","w01"];

    let split = item.value.split("_")

    if (/(m|h|w)01/.test(split[1])) {
      item.value = split[0]+"_"+genderArray[this.state.gender];

      item.uri = Platform.OS  == "Android" ? "file://"+Directory.ICON+item.value+".png" : icons[item.value];
    }

    output.push(item)
    this.setState({ output })
  };

  prepareKeyboard = () => {
    this.setState({ usingKeyboard: true })
    this.refs["myInput"].focus()
  };

  clearText = () => {
    this.setState({ usingKeyboard: false })
    this.setState({ text: null })
  }

  addTextItem = (text) => {
    if (text != undefined) {
      output = this.state.output
      output.push({ key: incrementalCounter(), uri: null, value: text })
      this.setState({ output })
    }
    this.clearText()
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
    if (item.uri != null && item.uri.length == 1 && item.uri === '|') {
      return (
        <Animated.View style={[styles.image, styles.inputCaret, {opacity: blink}]} />
      )
    } else {
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
    }
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
         { this.state.loading && 
           <Animated.Image
            style={styles.loading}
            source={require('../gui/loading.png')}/>
          }
          <View style={styles.output}>
            <FlatList 
              ref="outputList"
              extraData={this.state}
              numColumns={columns}
              data={
                this.state.output.concat([{key: -1, uri: '|', value: '|'}])
              }
              renderItem={this.renderOutput}
              onContentSizeChange={() => this.refs.outputList.scrollToEnd({animated: true})}
            />
          </View>
          <KeyboardAvoidingView style={styles.textInputContainer} behavior={Platform.OS === 'android' ? null : 'position'} enabled>
            <TextInput
              style={styles.textInput}
              onChangeText={(text) => this.setState({text})}
              value={this.state.text}
              returnKeyType={"done"}
              onSubmitEditing={() => this.addTextItem(this.state.text)}
              onBlur={() => this.clearText()}
              ref="myInput"
              maxLength = {45}
              numberOfLines = {2}
            />
            { !this.state.usingKeyboard && <View style={styles.textBlockingView}>
              <TouchableHighlight underlayColor='#0000' onPress={() => this.setGender(0)}>
                <Image style={[styles.image, this.state.gender != 0 ? styles.unfocused : {}]} source={require('../gui/han.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight underlayColor='#0000' onPress={() => this.setGender(1)}>
                <Image style={[styles.image, this.state.gender != 1 ? styles.unfocused : {}]} source={require('../gui/hen.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight underlayColor='#0000' onPress={() => this.setGender(2)}>
                <Image style={[styles.image, this.state.gender != 2 ? styles.unfocused : {}]} source={require('../gui/hon.png')} resizeMode='cover' />
              </TouchableHighlight>
            </View> }
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
              <TouchableHighlight underlayColor="red" onPress={() => this.checkViability(this.state.output)}>
                <Image style={styles.image} source={require('../gui/renderButton.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight onPress={() => this.prepareKeyboard()}>
                <Image style={styles.image} source={require('../gui/textButton.png')} resizeMode='cover' />
              </TouchableHighlight>
              <TouchableHighlight onPress={() => this.removeLastItem()}>
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
  unfocused: {
    height: itemWidth-24,
    width: itemWidth-24,
    margin: 12,
    opacity: 0.5
  },
  textInputContainer: {
    height: textInputHeight,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  textInput: {
    height: textInputHeight,
    width: width,
    fontSize: 32,
    fontFamily: 'Rubik-Regular'
  },
  textBlockingView: {
    height:textInputHeight,
    width: width-100,
    marginHorizontal: 50,
    marginTop: -textInputHeight,
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  loading: {
    transform: [{rotate: spin}],
    height: 100,
    width: 100,
    position: 'absolute',
    alignSelf: 'center'
  },
  output: {
    flex: 1,
    width: width,
    flexGrow: 1,
  },
  input: {
    width: width - itemWidth,
    height: itemWidth * inputRows,
  },
  inputCaret: {
     borderLeftColor: 'black',
     borderLeftWidth: 3,
     width: width-2,
     marginLeft: 2
  },
  bottomRight: {
  },
  image: {
  	height: itemWidth-6,
  	width: itemWidth-6,
    margin: 3
  },
  buttonColumn: {
    height: itemWidth * inputRows,
    width: itemWidth,
    flex: 1,
    justifyContent: 'space-between'
  },
  flexRight: {
    flexDirection: 'row',
  }
});

export default HomeScreen;