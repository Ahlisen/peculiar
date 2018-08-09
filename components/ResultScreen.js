import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  TouchableOpacity,
  SafeAreaView,
  Share
} from 'react-native';

import Video from 'react-native-video';
import RNShare from "react-native-share";

import Directory from '../constants/Directory';
import ProgressController from "./ProgressController";

class ResultScreen extends React.Component {
  state = {
    rate: 1,
    volume: 1,
    muted: false,
    duration: 0.0,
    currentTime: 0.0,
    paused: true,
    source: Directory.PICTOGRAM+"pictogram.mp4"
  };

  share = () => {
    const sharePath = "file://"+this.state.source;
    console.log("Sharing", sharePath);

    if (Platform.OS === 'android') {
      RNShare.open({
        title: 'Share your amazing Pictogram!',
        message: 'Wow! Look at this! An amazing Pictogram!',
        url: sharePath
      })
      .then(sharedResult => {
        console.log("GOT RESULT shared:", sharedResult);
      })
      .catch(err => {
        console.log("Share error:", err);
      });
    } else {
      const content = {
        title: 'Share your Pictogram!',
        url: sharePath
      };
      Share.share(content);
    }
  }

  togglePlay = () => {
    this.setState({ paused: !this.state.paused });
  }

  onLoad = data => {
    this.setState({ duration: data.duration });
  };

  onProgress = data => {
    this.setState({ currentTime: data.currentTime });
  };

  onSeek = (newPercent, paused) => {
    this.player.seek(newPercent * this.state.duration);
  }

  getCurrentTimePercentage(currentTime, duration) {
    if (currentTime > 0) {
        return parseFloat(currentTime) / parseFloat(duration) * 100;
    } else {
        return 0;
    }
  }

  render() {
    const completedPercentage = this.getCurrentTimePercentage(this.state.currentTime, this.state.duration);

    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center' }}>
        <View style={styles.videoContainer}>
          <TouchableOpacity onPress={this.togglePlay}
            style={styles.videoContainer}>
            <Video source={{ uri: this.state.source }}   // Can be a URL or a local file.
              ref={(ref) => {
                this.player = ref
              }}                                      // Store reference
              rate={this.state.rate}                              // 0 is paused, 1 is normal.
              volume={this.state.volume}                            // 0 is muted, 1 is normal.
              muted={this.state.muted}                           // Mutes the audio entirely.
              paused={this.state.paused}                          // Pauses playback entirely.
              resizeMode="cover"                      // Fill the whole screen at aspect ratio.*
              repeat={true}                           // Repeat forever.
              playInBackground={false}                // Audio continues to play when app entering background.
              playWhenInactive={false}                // [iOS] Video continues to play when control or notification center are shown.
              ignoreSilentSwitch={"ignore"}           // [iOS] ignore | obey - When 'ignore', audio will still play with the iOS hard silent switch set to silent.
              progressUpdateInterval={250.0}          // [iOS] Interval to fire onProgress (default to ~250ms)
              // onLoadStart={}            // Callback when video starts to load
              onLoad={this.onLoad}                    // Callback when video loads
              onProgress={this.onProgress}            // Callback every ~250ms with currentTime
              // onEnd={}                      // Callback when playback finishes
              onError={this.videoError}               // Callback when video cannot be loaded
              // onBuffer={}                // Callback when remote video is buffering
              // onTimedMetadata={}  // Callback when the stream receive some metadata
              style={styles.video} />
              { 
                this.state.paused && <View style={styles.playIconContainer}>
                  <Image style={styles.playIcon}
                  source={require("../gui/renderButton.png")}/>
                </View>
              }
            </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <ProgressController duration={this.state.duration}
            currentTime={this.state.currentTime}
            percent={completedPercentage}
            onNewPercent={this.onSeek.bind(this)} />
        </View>
        <View style={styles.horizontal}>
        <TouchableOpacity onPress={() => this.props.navigation.pop()}>
          <Image style={styles.shareIcon}
            source={require("../gui/backButton.png")} />
        </TouchableOpacity>
        <TouchableOpacity onPress={this.share}>
          <Image style={styles.shareIcon}
            source={require("../gui/shareButton.png")} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
            const { navigation } = this.props;
            const { routeName, key } = navigation.getParam('homeRoute');
            navigation.navigate({ routeName, key, params: { 'reset': true } });
          }
        }>
          <Image style={styles.shareIcon}
            source={require("../gui/forwardButton.png")} />
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  videoContainer: {
    width: 400,
    height: 400
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  playIcon: {
      width: 100,
      height: 100,
      opacity: 1
  },
  playIconContainer: {
    width: 400,
    height: 400,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  shareIcon: {
    width: 50,
    height: 50,
    margin: 10
  },
  progressBar: {
    alignSelf: "stretch",
    margin: 20
  },
  horizontal: {
    flex: 1,
    width: 400,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  }
});

export default ResultScreen;