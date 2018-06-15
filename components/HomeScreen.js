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

const {width, height} = Dimensions.get('window');
const columns = 5
const rows = 4
const itemWidth = width / columns;

console.log(RNFS.MainBundlePath)
    RNFS.readDir(RNFS.MainBundlePath+"/assets/images").then((data) => {
      data.forEach(thing => {
        console.log(thing.isDirectory(),thing.name)
      })
    })  

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    var thumbnails = [];

    Object.keys(images).forEach(key => {
      item = {key: String(key), uri: images[key]}
      thumbnails.push(item)
    });

    this.state = {
      output: [],
      thumbnails: thumbnails
    };
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
          <TouchableHighlight style={styles.bottomRight} onPress={() => this.props.navigation.navigate('Result')}>
            <Image style={styles.image} source={require('../images/render.png')} resizeMode='cover' />
          </TouchableHighlight>
        </View>
        <View style={styles.input}>
          <FlatList
            numColumns={columns}
            data={this.state.thumbnails}
            renderItem={this.renderInput}
          />
          <TouchableHighlight style={styles.bottomRight} onPress={() => this.removeLastItem()}>
            <Image style={styles.image} source={require('../images/remove.png')} resizeMode='cover' />
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