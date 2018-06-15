import React, { Component } from 'react';
import {
  createStackNavigator,
} from 'react-navigation'
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';

import StartScreen from './components/StartScreen';
import HomeScreen from './components/HomeScreen';
import ResultScreen from './components/ResultScreen';
import InstructionsScreen from './components/InstructionsScreen';
import VideoPlayer from './components/VideoPlayer';

const RootStack = createStackNavigator(
  {
    Start: {
      screen: StartScreen,
      navigationOptions: () => ({
        header: null
      })
    },
    Home: {
      screen: HomeScreen,
      navigationOptions: () => ({
        header: null
      })
    },
    Result: {
      screen: ResultScreen,
      navigationOptions: () => ({
        title: `Result`,
        headerBackTitle: `<--`,
        headerTintColor: 'black'
      })
    },
    Instructions: InstructionsScreen
  },
  {
    initialRouteName: 'Start',
    cardStyle: { backgroundColor: '#FFFFFF' },
    headerMode: 'screen',
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

