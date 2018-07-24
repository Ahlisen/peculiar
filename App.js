import React from 'react';
import {
  createStackNavigator,
} from 'react-navigation'

import StartScreen from './components/StartScreen';
import HomeScreen from './components/HomeScreen';
import ResultScreen from './components/ResultScreen';
import InstructionsScreen from './components/InstructionsScreen';

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

