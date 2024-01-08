/* eslint-disable prettier/prettier */
/* eslint-disable eqeqeq */
/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {
  View,
  Text,
  BackHandler,
  SafeAreaView,
  ToastAndroid,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
const {height, width} = Dimensions.get('window');
import styles from '../../styles';
import {RadioButton} from 'react-native-paper';
import {TextInput} from '@react-native-material/core';
import Loader from '../../Loader';
import Constants from '../../Constants';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export default class RqPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      secureTextEntry: true,
      phonenumber: '',
      passWord: '',
      errorMsg: false,
      fadeAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0),
      modalVisible: false,
      rqphoneNumber: '',
      checked: '',
    };

    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );

    Animated.parallel([
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }
  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }
  handleBackButtonClick() {
    this.props.navigation.navigate('AuthStackScreen', {screen: 'Login'});
    return true;
  }

  // componentDidMount() {
  //   Animated.parallel([
  //     Animated.timing(this.state.fadeAnim, {
  //       toValue: 1,
  //       duration: 1500,
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(this.state.scaleAnim, {
  //       toValue: 1,
  //       duration: 1500,
  //       useNativeDriver: true,
  //     }),
  //   ]).start();
  // }

  _rqPassword = () => {
    var obj = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        'api-version': 'V3',
      },
    };
    var url =
      Constants.SERVER_CALL +
      'requestForChangePassword?phoneNumber=' +
      this.state.rqphoneNumber;
    console.log(url);
    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log(json);
        if (json != null) {
          var obj = json.data;

          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            ToastAndroid.show(json.message, ToastAndroid.SHORT);
            this.props.navigation.push('AuthStackScreen', {
              screen: 'Login',
            });
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
              this.props.navigation.push('AuthStackScreen', {
                screen: 'login',
              }),
          },
        ]);
      });
  };

  render() {
    const {phonenumber, passWord} = this.state;
    const {fadeAnim, scaleAnim} = this.state;
    const {modalVisible} = this.state;

    return (
      <SafeAreaView
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}>
        <KeyboardAwareScrollView
          contentContainerStyle={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Animated.View
            style={[
              styles.logoContainer,
              {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
            ]}>
            <Image source={require('../../assets/greenko1.png')} style={{}} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#aaa',
                marginTop: 5,
              }}>
              Attendence Management
            </Text>
          </Animated.View>

          <View style={[{borderRadius: 20, marginTop: '4%'}]}>
            <TextInput
              value={this.state.rqphoneNumber}
              onChangeText={text => {
                this.setState({rqphoneNumber: text});
              }}
              label="Phone Number"
              variant="outlined"
              color="#808B96"
              maxLength={10}
              keyboardType="numeric"
              style={{
                width: width * 0.72,
                color: '#000',
                marginTop: 5,
              }}
            />
            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor:
                    this.state.rqphoneNumber == '' ||
                    this.state.rqphoneNumber == null ||
                    this.state.rqphoneNumber.length != 10
                      ? '#aaa'
                      : '#0ba6ff',
                  width: width * 0.72,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                },
              ]}
              disabled={
                this.state.rqphoneNumber == '' ||
                this.state.rqphoneNumber == null ||
                this.state.rqphoneNumber.length != 10
              }
              onPress={() => this._rqPassword()}>
              <Text style={[styles.btn_text, {color: '#fff'}]}>Submit</Text>
            </TouchableOpacity>
          </View>
          <Loader loading={this.state.loading} />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }
}
