"use strict";
import React, {Component} from "react";
import {Animated, PanResponder, Slider, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {PropTypes} from "prop-types"

let radiusOfHolder = 5;
let radiusOfActiveHolder = 7;
class ProgressController extends Component {

    constructor(props, context, ...args) {
        super(props, context, ...args);
        this.state = {lineX: new Animated.Value(0), slideX: new Animated.Value(0)};
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.moving) {
            this.state.slideX.setValue(this.computeScreenX(nextProps.percent));
        }
    }

    computeScreenX(percent) {
        return percent * this.state.width / 100;
    }

    componentWillMount() {
        this.holderPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onPanResponderGrant: (e, gestureState) => {
                let {slideX} = this.state;
                this.setState({moving: true});
                slideX.setOffset(slideX._value);
                slideX.setValue(0);
            },
            onPanResponderMove: (e, gestureState) => {
                let totalX = this.state.slideX._offset + gestureState.dx;
                let newPercent = (totalX / this.state.width) * 100;
                this.notifyPercentChange(newPercent, true);
                Animated.event([
                    null, {dx: this.state.slideX}
                ])(e, gestureState);
            },
            onPanResponderRelease: (e, gesture) => {
                this.state.slideX.flattenOffset();
                let newPercent = (this.state.slideX._value / this.state.width) * 100;
                this.setState({moving: false});
                this.notifyPercentChange(newPercent, false);
            }
        });
    }

    notifyPercentChange(newPercent, paused) {
        let {onNewPercent} = this.props;
        if (onNewPercent instanceof Function) {
            onNewPercent(newPercent/100, paused);
        }
    }

    onLayout(e) {
        this.setState({width: e.nativeEvent.layout.width - (radiusOfHolder * 2)});
    }

    getHolderStyle() {
        let {moving, slideX, width} = this.state;

        if (width > 0) {
            // var interpolatedAnimation = slideX.interpolate({
            //     inputRange: [0, width],
            //     outputRange: [0, width],
            //     extrapolate: "clamp"
            // });
            console.log("interpolatedAnimation:", isNaN(slideX._value) ? 0 : slideX._value)
            // interpolatedAnimation = 100;
            return [styles.holder, moving && styles.activeHolder,
                {transform: [{translateX: isNaN(slideX._value) ? 0 : slideX._value}]}
            ];
        } else {
            return [styles.holder];
        }
    }

    onLinePressed(e) {
        let newPercent = (e.nativeEvent.locationX / this.state.width) * 100;
        this.notifyPercentChange(newPercent, false);
    }

    render() {
        let {moving} = this.state;
        let {currentTime, duration, percent} = this.props;
        return <View style={styles.view}>
            <View style={styles.barView}
                    onLayout={this.onLayout.bind(this)} {...this.holderPanResponder.panHandlers}>
                <View style={{flex: 1, flexDirection: "row", top: moving ? radiusOfActiveHolder : radiusOfHolder}}>
                    <TouchableOpacity style={[styles.line, {flex: percent, borderColor: "black"}]}
                                        onPress={this.onLinePressed.bind(this)}/>
                    <TouchableOpacity style={[styles.line, {flex: 100 - percent, borderColor: "lightgrey"}]}
                                        onPress={this.onLinePressed.bind(this)}/>
                </View>
                <Animated.View style={this.getHolderStyle()}/>
            </View>
        </View>
    }
}

let height = 40;
let styles = StyleSheet.create({
    view: {flex: 1, flexDirection: "row", height, alignItems: "center"},
    barView: {flex: 1},
    timeText: {color: "white"},
    line: {borderWidth: 1, padding: 0},
    holder: {
        height: radiusOfHolder * 2,
        width: radiusOfHolder * 2,
        borderRadius: radiusOfHolder,
        backgroundColor: "black"
    },
    activeHolder: {
        height: radiusOfActiveHolder * 2,
        width: radiusOfActiveHolder * 2,
        borderRadius: radiusOfActiveHolder,
        backgroundColor: "black"
    }
});

ProgressController.propTypes = {
    currentTime: PropTypes.number,
    percent: PropTypes.number,
    onNewPercent: PropTypes.func,
    duration: PropTypes.number
};

export default ProgressController;