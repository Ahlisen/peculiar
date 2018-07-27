import React from 'react';
import { Platform } from 'react-native'
import { createStackNavigator } from 'react-navigation'

import StartScreen from './components/StartScreen';
import HomeScreen from './components/HomeScreen';
import ResultScreen from './components/ResultScreen';
import InstructionsScreen from './components/InstructionsScreen';

let initialRoute = Platform.select({
  ios: "Home",
  android: "Start"
});

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
        header: null
      })
    },
    Instructions: InstructionsScreen
  },
  {
    initialRouteName: initialRoute,
    cardStyle: { backgroundColor: '#FFFFFF' },
    headerMode: 'screen',
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

