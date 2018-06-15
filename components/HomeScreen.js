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
  Dimensions
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

const {width, height} = Dimensions.get('window');
const columns = 5
const rows = 4
const itemWidth = width / columns;
const videoExt = ".mp4";
const savedFilePath = Directory.PICTOGRAM+"pictogram"+videoExt;

// RNFS.readDir(path + "/videos")
//     .then(dir => {
//       console.log('GOT RESULT dir:', dir);
//       videos = [];
//       dir.forEach(video => {
//         videos.push(video.name);
//       });
//       console.log('GOT RESULT videos:', videos);
//     })

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

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    var thumbnails = [];

    RNFS.readDir(RNFS.DocumentDirectoryPath).then((data) => {
    	console.log(data)
    })

    Object.keys(icons).forEach(key => {
      item = {key: String(key), uri: icons[key]}
      thumbnails.push(item)
    });

    this.state = {
      output: [],
      thumbnails: thumbnails
    };
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

  removeLastItem = () => {
    output = this.state.output
    if (output.length > 0) {
      output.pop()
    }
    this.setState({ output })
  };

  renderOutput = ({item}) => {
    return (
      <View>
        <Image style={styles.image} source={item.uri} resizeMode='cover' />
      </View>
    )
  };

  renderInput = ({item}) => {
    return (
      <TouchableHighlight onPress={() => this.addItem(item)}>
        <Image style={styles.image} source={item.uri} resizeMode='cover' />
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
          		() => this.merge(
          			this.state.output.map((item) => {
          				return Directory.VIDEO+item.key+videoExt 
          			})
          		)
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