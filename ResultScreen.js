import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';
import Video from 'react-native-video';

class ResultScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Result</Text>
        <View style={styles.videoContainer}>
          <Video source={require('./data/woman_walk.mp4')}   // Can be a URL or a local file.
            poster="https://baconmockup.com/300/200/" // uri to an image to display until the video plays
            ref={(ref) => {
              this.player = ref
            }}                                      // Store reference
            rate={1.0}                              // 0 is paused, 1 is normal.
            volume={1.0}                            // 0 is muted, 1 is normal.
            muted={false}                           // Mutes the audio entirely.
            paused={false}                          // Pauses playback entirely.
            resizeMode="cover"                      // Fill the whole screen at aspect ratio.*
            repeat={true}                           // Repeat forever.
            playInBackground={false}                // Audio continues to play when app entering background.
            playWhenInactive={false}                // [iOS] Video continues to play when control or notification center are shown.
            ignoreSilentSwitch={"ignore"}           // [iOS] ignore | obey - When 'ignore', audio will still play with the iOS hard silent switch set to silent.
            progressUpdateInterval={250.0}          // [iOS] Interval to fire onProgress (default to ~250ms)
            onLoadStart={this.loadStart}            // Callback when video starts to load
            onLoad={this.setDuration}               // Callback when video loads
            onProgress={this.setTime}               // Callback every ~250ms with currentTime
            onEnd={this.onEnd}                      // Callback when playback finishes
            onError={this.videoError}               // Callback when video cannot be loaded
            onBuffer={this.onBuffer}                // Callback when remote video is buffering
            onTimedMetadata={this.onTimedMetadata}  // Callback when the stream receive some metadata
            style={styles.video} />
        </View>
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.navigate('Home')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  videoContainer: {
    height: 400,
    width: 400,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

module.exports = ResultScreen;