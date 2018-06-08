import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Image
} from 'react-native';

const thumbnails = [{key: 'a'}, {key: 'b'}];


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
        <Image source={{uri: 'check'}} style={{width: 42, height: 42}} />
        <FlatList
          horizontal
          data={thumbnails}
          renderItem={({item}) => <Text>{item.key}</Text>}
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

export default HomeScreen;