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

const {width, height} = Dimensions.get('window');
const columns = 5
const itemWidth = width / columns;

class HomeScreen extends React.Component {

  constructor(props) {
    super(props);

    var thumbnails = [];

    for (var i = 0; i < 100; i++) {
      item = {key: String(i)}
      thumbnails.push(item)
    }

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

  renderItem = ({item}) => {
    return (
      <View>
        <Text>key: {item.key}</Text>
        <Image style={{ height: itemWidth,  width : itemWidth}} source={require('../images/placeholder2.png')} resizeMode='cover' />
      </View>
    )
  };

  renderInputItem = ({item}) => {
    return (
      <TouchableHighlight onPress={() => this.addItem(item)}>
        <Image style={{ height: itemWidth,  width : itemWidth}} source={require('../images/placeholder2.png')} resizeMode='cover' />
      </TouchableHighlight>
    )
  };

  /*
  *   loading assets in ios: { uri: 'check' }
  *   require() loads noticably slower than {uri:_} in flatlist.
  *   
  */

  render() {
    return (
      <View style={styles.container}>

        <View style={styles.output}>
          <FlatList 
            extraData={this.state}
            numColumns={columns}
            data={this.state.output}
            renderItem={this.renderItem}
          />
          <TouchableHighlight style={styles.bottomRight} onPress={() => this.props.navigation.navigate('Result')}>
            <Image style={{ height: itemWidth,  width : itemWidth}} source={require('../images/render.png')} resizeMode='cover' />
          </TouchableHighlight>
        </View>
        <View style={styles.input}>
          <FlatList 
            // horizontal
            numColumns={columns}
            data={this.state.thumbnails}
            renderItem={this.renderInputItem}
          />
          <TouchableHighlight style={styles.bottomRight} onPress={() => this.removeLastItem()}>
            <Image style={{ height: itemWidth,  width : itemWidth}} source={require('../images/remove.png')} resizeMode='cover' />
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

type Props = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  output: {
    position: 'relative',
    width: width,
    height: itemWidth * 4
  },
  input: {
    position: 'relative',
    height: itemWidth * 4
  },
  bottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0
  }
});

export default HomeScreen;