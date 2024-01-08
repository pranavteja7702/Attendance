/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import {
  View,
  Text,
  BackHandler,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ToastAndroid,
  StyleSheet,
  Alert,
} from 'react-native';
import styles from '../../styles';
import Constants from '../../Constants';
const {height, width} = Dimensions.get('window');
import Loader from '../../Loader';
import {Appbar} from 'react-native-paper';
import {TextInput} from '@react-native-material/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export default class Password extends Component {
  constructor(props) {
    super(props);
    this.state = {
      driverName: '',
      userToken: '',
      driverID: '',
      refreshing: false,
      loading: false,
      Date: '',
      newPassword: '',
      confirmPassword: '',
      comeFrom:
        props.route != null &&
        props.route.params != null &&
        props.route.params.comeFrom != undefined
          ? props.route.params.comeFrom
          : '',
      userID: '',
      userName: '',
      userModule: '',
    };

    try {
      AsyncStorage.getItem('USER')
        .then(value => {
          if (value != '' && value != null) {
            var user = JSON.parse(value);
            var userData = user.data;

            console.log('====================================');
            console.log(userData);
            console.log('====================================');
            this.setState({
              userToken: user.Token,
              userID: user.data.usersId,
              userName: userData.name,
              userModule: userData.module,
            });
          }
        })
        .done();
    } catch (error) {}
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }
  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }
  handleBackButtonClick() {
    if (
      this.state.comeFrom != null &&
      this.state.comeFrom != '' &&
      this.state.comeFrom == 'DashBoard'
    ) {
      this.props.navigation.navigate('AppStackScreen', {
        screen: this.state.comeFrom,
      });
    } else {
      BackHandler.exitApp();
    }
    return true;
  }

  _updatePassword = async () => {
    var data = {};
    data['usersId'] = Number(this.state.userID);
    data['password'] = this.state.confirmPassword;

    console.log(data);
    var headers = Constants.HEADERS;
    headers['Authorization'] = 'Token ' + this.state.userToken;
    headers['module'] = this.state.userModule;
    headers['Content-Type'] = 'application/json';
    var obj = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    console.log(obj);
    var url = Constants.SERVER_CALL + 'resetPassword';
    console.log(url);
    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log(json);
        console.log('json............................................');

        if (json != null) {
          var obj = json.data;

          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            ToastAndroid.show(json.message, ToastAndroid.SHORT);
            if (
              this.state.comeFrom != null &&
              this.state.comeFrom != '' &&
              this.state.comeFrom == 'DashBoard'
            ) {
              await AsyncStorage.removeItem('USER');
              this.props.navigation.push('AuthStackScreen', {
                screen: 'Login',
              });
            } else {
              this.props.navigation.push('AuthStackScreen', {
                screen: 'Login',
              });
            }
          } else if (json.status == 'error') {
            Alert.alert('Warning !', json.message);
          } else {
            this.setState({errorMsg: true});
          }
        }
      })
      .catch(error => {
        this.setState({loading: false});

        Alert.alert('Warning !', 'Something went wrong please try later.', [
          {
            text: 'OK',
            onPress: () =>
              this.props.navigation.navigate('AuthStackScreen', {
                screen: 'login',
              }),
          },
        ]);
      });
  };

  render() {
    return (
      <SafeAreaView style={{...StyleSheet.absoluteFill}}>
        <Appbar.Header>
          {this.state.comeFrom == 'DashBoard' ? (
            <Appbar.BackAction
              onPress={() =>
                this.props.navigation.navigate('AppStackScreen', {
                  screen: 'DashBoard',
                })
              }
              color="#8E44AD"
            />
          ) : null}
          <Appbar.Content
            title="Update Password"
            titleStyle={styles.headerText}
          />
        </Appbar.Header>

        <KeyboardAwareScrollView
          contentContainerStyle={{
            flex: 1,
            //alignItems: 'center',
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps={'handled'}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image
              style={{
                width: 100,
                height: 100,
                marginBottom: 20,
              }}
              source={require('../../assets/padlock.png')}
            />

            <TextInput
              value={this.state.newPassword}
              onChangeText={text => {
                this.setState({newPassword: text});
              }}
              label="New Password"
              variant="outlined"
              color="#808B96"
              style={{width: width * 0.8, color: '#aaa'}}
            />

            <TextInput
              value={this.state.confirmPassword}
              onChangeText={text => {
                this.setState({confirmPassword: text});
              }}
              label="Confirm Password"
              variant="outlined"
              color="#808B96"
              style={{width: width * 0.8, color: '#000', marginTop: 8}}
            />
          </View>

          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={() => this._updatePassword()}
            disabled={
              this.state.newPassword != this.state.confirmPassword ||
              this.state.confirmPassword == '' ||
              this.state.confirmPassword == null ||
              this.state.newPassword == '' ||
              this.state.newPassword == null ||
              this.state.newPassword.length < 6 ||
              this.state.confirmPassword.length < 6
            }>
            <View
              style={[
                styles.btn,
                {
                  width: width * 0.8,
                  backgroundColor:
                    this.state.newPassword == '' ||
                    this.state.newPassword == null ||
                    this.state.confirmPassword == '' ||
                    this.state.confirmPassword == null ||
                    this.state.newPassword !== this.state.confirmPassword ||
                    this.state.newPassword.length < 6 ||
                    this.state.confirmPassword.length < 6
                      ? '#ccc'
                      : '#8E44AD',
                  padding: 10,
                },
              ]}>
              <Text style={[styles.btn_text, {color: '#fff'}]}>Submit</Text>
            </View>
          </TouchableOpacity>
        </KeyboardAwareScrollView>

        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
