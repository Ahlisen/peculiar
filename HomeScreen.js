import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Instructions"
          onPress={() => this.props.navigation.navigate('Instructions')}
        />
        <Button
          title="Render"
          onPress={() => this.props.navigation.navigate('Result')}
        />
      </View>
    );
  }
}

type Props = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

module.exports = HomeScreen;