import React, { Component } from 'react';
import {
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import {PropTypes} from "prop-types"

export default class AnimatedButton extends Component {

    constructor(props) {
        super(props);
        this.props = props;

        console.log("Style:", this.props.style);

        this.handlePressIn = this.handlePressIn.bind(this);
        this.handlePressOut = this.handlePressOut.bind(this);
    }

    componentWillMount() {
        this.springValue = new Animated.Value(1);
    }

    handlePressIn() {
        Animated.spring(this.springValue, {
            toValue: 0.8
        }).start();
    }

    handlePressOut() {
        Animated.spring(this.springValue, {
            toValue: 1,
            friction: 4,
            tension: 200
        }).start();
    }

    render() {
        const animatedStyle = {
            transform: [{ scale: this.springValue }],
            opacity: this.springValue
        };

        return (
            <TouchableWithoutFeedback
                onPress={this.props.onPress}
                onPressIn={this.handlePressIn}
                onPressOut={this.handlePressOut}
            >
                <Animated.View style={[this.props.style, animatedStyle]}>
                    {this.props.children}
                </Animated.View>
            </TouchableWithoutFeedback>
        )
    }
}

AnimatedButton.propTypes = {
    onPress: PropTypes.func
};