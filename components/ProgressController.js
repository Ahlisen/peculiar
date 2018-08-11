"use strict";
import React, {Component} from "react";
import {Animated, PanResponder, Slider, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {PropTypes} from "prop-types"

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
        this.setState({width: e.nativeEvent.layout.width - 10});
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
                <TouchableOpacity style={styles.holder}>
                    <View style={[styles.line, {flex: percent, borderColor: "black"}]}
                                        onPress={this.onLinePressed.bind(this)}/>
                    <View style={[styles.line, {flex: 100 - percent, borderColor: "lightgrey"}]}
                                        onPress={this.onLinePressed.bind(this)}/>
                </TouchableOpacity>
            </View>
        </View>
    }
}

let height = 40;
let styles = StyleSheet.create({
    view: {flex: 1, flexDirection: "row", height, alignItems: "center"},
    barView: {flex: 1},
    line: {borderWidth: 2, padding: 0},
    holder: {
        paddingTop: 20,
        paddingBottom: 20,
        flex: 1,
        flexDirection: "row"
    }
});

ProgressController.propTypes = {
    currentTime: PropTypes.number,
    percent: PropTypes.number,
    onNewPercent: PropTypes.func,
    duration: PropTypes.number
};

export default ProgressController;