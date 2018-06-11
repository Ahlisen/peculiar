import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  PermissionsAndroid
} from 'react-native';

import RNFS from "react-native-fs";
import { unzip, subscribe } from 'react-native-zip-archive';

import Directory from "../constants/Directory"

async function requestReadWriteStoragePermission() {
  try {
    const permissions = await PermissionsAndroid.requestMultiple(
      [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]
    )

    var granted = true;
    Object.keys(permissions).forEach(key => {
      console.log("Permission:", permissions[key]);
      if (permissions[key] !== PermissionsAndroid.RESULTS.GRANTED) {
        granted = false;
      }
    });

    if (granted === true) {
      console.log("You can use the file system")
      return true
    } else {
      console.log("Read external storage permission denied")
      return false
    }
  } catch (err) {
    console.warn(err)
    return false
  }
}

function unzipExpansionFiles() {
  return RNFS.readDir(RNFS.ExternalStorageDirectoryPath + "/Android/obb/com.peculiar")
    .then((result) => {
      console.log('GOT RESULT:', result);
      return unzip(result[0].path, RNFS.DocumentDirectoryPath);
    })
    .then((path) => {
      console.log(`GOT RESULT: unzip completed at ${path}`)
      return RNFS.readDir(path + "/videos");
    })
    .then(dir => {
      console.log('GOT RESULT dir:', dir);
      videos = [];
      dir.forEach(video => {
        videos.push(video.name);
      });
      console.log('GOT RESULT videos:', videos);
      return Promise.resolve();
    })
    .catch((err) => {
      console.log("Got Error:", err.message, err.code);
      return Promise.reject(err.message);
    });
}

class StartScreen extends React.Component {

  constructor() {
    super();

    // TODO: Only do this for Android
    this.state = {buttonDisabled: true};

    (async () => {
      if (await requestReadWriteStoragePermission() === false) {
        // TODO: Show request-permission-button
        return;
      }

      RNFS.exists(Directory.VIDEO)
        .then(videosExist => {
          if (!videosExist) {
            unzipExpansionFiles()
              .then(() => {
                this.setState({ buttonDisabled: false });
                console.log("Unzipped & Button enabled!");
              })
              .catch(() => {
                // TODO: Retry unzip
                this.setState({ buttonDisabled: true });
              });
          } else {
            this.setState({ buttonDisabled: false});
            console.log("Button enabled!");
          }
        });
    })();
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title} >Pictogram</Text>
        <Image source={require('../images/placeholder.png')} />
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.replace('Home')}
          disabled={this.state.buttonDisabled}
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