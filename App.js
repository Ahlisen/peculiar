import React, { Component } from 'react';
import VideoPlayer from './components/VideoPlayer';
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

import StartScreen from './StartScreen';
import HomeScreen from './HomeScreen';
import ResultScreen from './ResultScreen';
import InstructionsScreen from './InstructionsScreen';

const RootStack = createStackNavigator(
  {
    Start: StartScreen,
    Home: HomeScreen,
    Result: ResultScreen,
    Instructions: InstructionsScreen,
  },
  {
    initialRouteName: 'Start',
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

