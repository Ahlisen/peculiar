import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
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
      console.log("StartScreen", "Permission:", permissions[key]);
      if (permissions[key] !== PermissionsAndroid.RESULTS.GRANTED) {
        granted = false;
      }
    });

    if (granted === true) {
      console.log("StartScreen", "You can use the file system")
      return true
    } else {
      console.log("StartScreen", "Read external storage permission denied")
      return false
    }
  } catch (err) {
    console.warn(err)
    return false
  }
}

function unzipExpansionFiles() {
  return RNFS.readDir(RNFS.ExternalStorageDirectoryPath + "/Android/obb/se.peculiar")
    .then((result) => {
      console.log("StartScreen", 'GOT RESULT:', result);
      return unzip(result[0].path, RNFS.DocumentDirectoryPath);
    })
    .then((path) => {
      console.log("StartScreen", `GOT RESULT: unzip completed at ${path}`);
      return Promise.resolve();
    })
    .catch((err) => {
      console.log("StartScreen", "Got Error:", err.message, err.code);
      return Promise.reject(err.message);
    });
}

class StartScreen extends React.Component {

  constructor() {
    super();

    this.state = {
      requestDenied: false,
      buttonDisabled: true
    }
    
    if (Platform.OS === 'android') {
      this.state.buttonDisabled = true;
      this.requestPermissionAndUnzip();
    } else {
      this.state.buttonDisabled = false;
    }
  }

  requestPermissionAndUnzip = async () => {
      if (await requestReadWriteStoragePermission() === false) {
        this.setState({ requestDenied: true });
        return;
      }
      this.checkAndUnzipAssets();
  }

  checkAndUnzipAssets = () => {
    RNFS.exists(Directory.VIDEO)
      .then(videosExist => {
        if (!videosExist) {
          unzipExpansionFiles()
            .then(() => {
              console.log("StartScreen", "Unzip complete!");
              this.props.navigation.replace('Home');
            })
            .catch(() => {
              // TODO; Error message
            });
        } else {
          this.props.navigation.replace('Home');
        }
      });
  }

  render() {
    return (
      <View style={[styles.container, {opacity: this.state.requestDenied ? 1:0}]}>
        <Text style={styles.title}>PICTOGRAM</Text>
        <Image source={require('../gui/henIcon.png')} style={{width: 127, height: 256}} />
        <Text style={styles.description}>
          Pictogram needs
          <Text style={{fontWeight: "bold"}}> read and write </Text>
          access to the phone's storage to
          <Text style={{fontWeight: "bold"}}> read the app's videos</Text>
          , and allow you to
          <Text style={{fontWeight: "bold"}}> save your pictograms.</Text>
        </Text>
        <Button onPress={this.requestPermissionAndUnzip}
          disabled={!this.state.requestDenied}
          title="Request permission"
          color="#000"
          accessibilityLabel="Request storage permission" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  title: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 42,
  },
  description: {
    color: 'black',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginVertical: -40
  }
});

export default StartScreen;