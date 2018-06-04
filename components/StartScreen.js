import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  Image
} from 'react-native';

class StartScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title} >Pictogram</Text>
        <Image source={require('../images/placeholder.png')} />
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.replace('Home')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: 'grey',
    fontWeight: 'bold',
    fontSize: 72,
  }
});

export default StartScreen;