import React, {Component} from 'react';
import {LogBox, View, Alert} from 'react-native';
import AppNavigator from './src/AppNavigator';
import CodePush from 'react-native-code-push';
import NetInfo from '@react-native-community/netinfo';

class App extends Component {
  componentDidMount() {
    LogBox.ignoreAllLogs([
      'ViewPropTypes will be removed',
      'ColorPropType will be removed',
    ]);
  }

  render() {
    return <AppNavigator />;
  }
}
export default CodePush(App);
