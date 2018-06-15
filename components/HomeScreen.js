import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';

import RNFS from "react-native-fs";
import RNVideoEditor from "react-native-video-editor";

import Directory from '../constants/Directory';

const videoExt = ".mp4";

// RNFS.readDir(path + "/videos")
//     .then(dir => {
//       console.log('GOT RESULT dir:', dir);
//       videos = [];
//       dir.forEach(video => {
//         videos.push(video.name);
//       });
//       console.log('GOT RESULT videos:', videos);
//     })

function moveToPictogramDir(file) {
  return new Promise((resolve, reject) => {
    const movedFile = Directory.PICTOGRAM+"1.mp4";
    RNFS.moveFile(file, movedFile)
      .then(() => {
        resolve()
      })
      .catch(() =>{
        reject()
      })
  });
}

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
          onPress={() => {
            RNVideoEditor.merge(
              [
                Directory.VIDEO + "skratt" + videoExt,
                Directory.VIDEO + "woman_walk" + videoExt,
                Directory.VIDEO + "skratt" + videoExt,
                Directory.VIDEO + "woman_walk" + videoExt,
                Directory.VIDEO + "woman_walk" + videoExt
              ],
              results => {
                alert("Error: " + results);
              },
              (results, file) => {
                RNFS.exists(Directory.PICTOGRAM)
                  .then(pictogramDirExists => {
                    if (!pictogramDirExists) {
                      RNFS.mkdir(Directory.PICTOGRAM)
                        .then(() => {
                          moveToPictogramDir(file)
                            .then(() => {
                              this.props.navigation.navigate('Result');
                            })
                        })
                    } else {
                      moveToPictogramDir(file)
                        .then(() => {
                          this.props.navigation.navigate('Result');
                        })
                    }
                  });
              }
            );
          }}
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