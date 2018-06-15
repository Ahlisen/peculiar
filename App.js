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

