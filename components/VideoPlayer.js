"use strict";

import React, { Component } from "react";

import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from "react-native";

import Video from "react-native-video";
import RNVideoEditor from "react-native-video-editor";
import RNFS from "react-native-fs";
import { unzip, subscribe } from 'react-native-zip-archive'

const videoDir = "videos/";
const videoExt = ".mp4";
const dirHome = Platform.select({
  ios: `${RNFS.DocumentDirectoryPath}`,
  android: `${RNFS.ExternalStorageDirectoryPath}`
});

let videos = [];

export default class VideoPlayer extends Component {
  state = {
    rate: 1,
    volume: 1,
    muted: false,
    resizeMode: "contain",
    duration: 0.0,
    currentTime: 0.0,
    paused: true,
    source: { uri: videoDir+"woman_walk", mainVer: 1, patchVer: 0 }
  };

  video: Video;

  togglePlay = () => {
    this.setState({ paused: !this.state.paused });

    if (!this.state.paused) {
      console.log("GOT dirHome:", dirHome);

      RNFS.readDir(RNFS.ExternalStorageDirectoryPath + "/Android/obb/com.peculiar")
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
          dir.forEach(video => {
            videos.push(video.name);
          });
          console.log('GOT RESULT videos:', videos);

          RNVideoEditor.merge(
            [
              RNFS.DocumentDirectoryPath + "/" + videoDir + "woman_walk" + videoExt,
              RNFS.DocumentDirectoryPath + "/" + videoDir + "skratt" + videoExt
            ],
            results => {
              alert("Error: " + results);
            },
            (results, file) => {
              alert("Success : " + results + " file: " + file);
              this.setState({ source: { uri: file } });
            }
          );
        })
        .catch((err) => {
          console.log("Got Error:", err.message, err.code);
        });
    }
  }

  onLoad = data => {
    this.setState({ duration: data.duration });
  };

  onProgress = data => {
    this.setState({ currentTime: data.currentTime });
  };

  onEnd = () => {
    // this.setState({ paused: true });
    // this.video.seek(0);
  };

  onAudioBecomingNoisy = () => {
    this.setState({ paused: true });
  };

  onAudioFocusChanged = (event: { hasAudioFocus: boolean }) => {
    this.setState({ paused: !event.hasAudioFocus });
  };

  getCurrentTimePercentage() {
    if (this.state.currentTime > 0) {
      return (
        parseFloat(this.state.currentTime) / parseFloat(this.state.duration)
      );
    }
    return 0;
  }

  renderRateControl(rate) {
    const isSelected = this.state.rate === rate;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ rate });
        }}
      >
        <Text
          style={[
            styles.controlOption,
            { fontWeight: isSelected ? "bold" : "normal" }
          ]}
        >
          {rate}x
        </Text>
      </TouchableOpacity>
    );
  }

  renderResizeModeControl(resizeMode) {
    const isSelected = this.state.resizeMode === resizeMode;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ resizeMode });
        }}
      >
        <Text
          style={[
            styles.controlOption,
            { fontWeight: isSelected ? "bold" : "normal" }
          ]}
        >
          {resizeMode}
        </Text>
      </TouchableOpacity>
    );
  }

  renderVolumeControl(volume) {
    const isSelected = this.state.volume === volume;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ volume });
        }}
      >
        <Text
          style={[
            styles.controlOption,
            { fontWeight: isSelected ? "bold" : "normal" }
          ]}
        >
          {volume * 100}%
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const flexCompleted = this.getCurrentTimePercentage() * 100;
    const flexRemaining = (1 - this.getCurrentTimePercentage()) * 100;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.fullScreen}
          onPress={this.togglePlay}
        >
          <Video
            ref={(ref: Video) => {
              this.video = ref;
            }}
            /* For ExoPlayer */
            /* source={{ uri: 'http://www.youtube.com/api/manifest/dash/id/bf5bb2419360daf1/source/youtube?as=fmp4_audio_clear,fmp4_sd_hd_clear&sparams=ip,ipbits,expire,source,id,as&ip=0.0.0.0&ipbits=0&expire=19000000000&signature=51AF5F39AB0CEC3E5497CD9C900EBFEAECCCB5C7.8506521BFC350652163895D4C26DEE124209AA9E&key=ik0', type: 'mpd' }} */
            source={ this.state.source }
            style={styles.fullScreen}
            rate={this.state.rate}
            paused={this.state.paused}
            volume={this.state.volume}
            muted={this.state.muted}
            resizeMode={this.state.resizeMode}
            repeat={true}
            playInBackground={false} // Audio continues to play when app entering background.
            playWhenInactive={false} // [iOS] Video continues to play when control or notification center are shown.
            ignoreSilentSwitch={"ignore"} // [iOS] ignore | obey - When 'ignore', audio will still play with the iOS hard silent switch set to silent.
            progressUpdateInterval={250.0} // [iOS] Interval to fire onProgress (default to ~250ms)
            onLoadStart={this.loadStart}
            onLoad={this.onLoad}
            onProgress={this.onProgress}
            onEnd={this.onEnd}
            onError={this.videoError}
            onBuffer={this.onBuffer}
            onTimedMetadata={this.onTimedMetadata} // Callback when the stream receive some metadata
            onAudioBecomingNoisy={this.onAudioBecomingNoisy}
            onAudioFocusChanged={this.onAudioFocusChanged}
          />
        </TouchableOpacity>

        <View style={styles.controls}>
          <View style={styles.generalControls}>
            <View style={styles.rateControl}>
              {this.renderRateControl(0.25)}
              {this.renderRateControl(0.5)}
              {this.renderRateControl(1.0)}
              {this.renderRateControl(1.5)}
              {this.renderRateControl(2.0)}
            </View>

            <View style={styles.volumeControl}>
              {this.renderVolumeControl(0.5)}
              {this.renderVolumeControl(1)}
              {this.renderVolumeControl(1.5)}
            </View>

            <View style={styles.resizeModeControl}>
              {this.renderResizeModeControl("cover")}
              {this.renderResizeModeControl("contain")}
              {this.renderResizeModeControl("stretch")}
            </View>
          </View>

          <View style={styles.trackingControls}>
            <View style={styles.progress}>
              <View
                style={[styles.innerProgressCompleted, { flex: flexCompleted }]}
              />
              <View
                style={[styles.innerProgressRemaining, { flex: flexRemaining }]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black"
  },
  fullScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  controls: {
    backgroundColor: "transparent",
    borderRadius: 5,
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 3,
    overflow: "hidden"
  },
  innerProgressCompleted: {
    height: 20,
    backgroundColor: "#cccccc"
  },
  innerProgressRemaining: {
    height: 20,
    backgroundColor: "#2C2C2C"
  },
  generalControls: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    paddingBottom: 10
  },
  rateControl: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  volumeControl: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  resizeModeControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  controlOption: {
    alignSelf: "center",
    fontSize: 11,
    color: "#E05050",
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12
  }
});

AppRegistry.registerComponent("VideoPlayer", () => VideoPlayer);
