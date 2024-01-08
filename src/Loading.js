/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, View} from 'react-native';

export default class Loading extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      loading: false,
      isConnected: false,
    };
    this._getUserData();
  }

  _getUserData = async () => {
    var ADMIN = await AsyncStorage.getItem('ADMIN');
    var LOGOUT = await AsyncStorage.getItem('ISLOGOUT');
    var MODULE = await AsyncStorage.getItem('MODULE');
    console.log(ADMIN);
    console.log(
      MODULE,
      'MODULE...............................................................',
    );
    var USER = JSON.parse(await AsyncStorage.getItem('USER'));
    if (ADMIN == null && USER == null) {
      this.setState({loading: false});
      console.log('1');
      this.props.navigation.push('AuthStackScreen', {
        screen: 'Login',
      });
    } else {
      if (ADMIN != '' && ADMIN != null) {
        if (MODULE != null) {
          console.log('2');
          console.log(ADMIN, '^^^^^^^^^^^^^^^^^^^^^^');
          this.props.navigation.push('AppStackScreen', {
            screen: 'Home',
          });
        } else {
          this.props.navigation.push('AuthStackScreen', {
            screen: 'Login',
          });
        }
      } else if (USER && USER?.data?.resetPassword == 'PENDING') {
        console.log('3');
        console.log(ADMIN);

        this.props.navigation.push('AuthStackScreen', {
          screen: 'Password',
        });
      } else if (USER != '' && USER != null) {
        console.log('4');
        console.log(USER);

        this.props.navigation.push('AppStackScreen', {
          screen: 'DashBoard',
        });
      }
    }
  };
  render() {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}></View>
    );
  }
}
