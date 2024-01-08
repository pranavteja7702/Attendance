/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import {
  View,
  Text,
  BackHandler,
  ToastAndroid,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Keyboard,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {height, width} = Dimensions.get('window');
import EIcon from 'react-native-vector-icons/Entypo';
import styles from '../../styles';
import {TextInput} from '@react-native-material/core';
import Loader from '../../Loader';
import Constants from '../../Constants';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DeviceInfo from 'react-native-device-info';
import base64 from 'react-native-base64';
import jwt_decode from 'jwt-decode';
import SModal from 'react-native-modal';
import {RadioButton} from 'react-native-paper';
import IIcon from 'react-native-vector-icons/Ionicons';

export default class Login extends Component {
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
      validPhoneNumber: false,
      loggedInUser: '',
      loginStatus: '',
      accessRoles: [],
      checked: '',
    };

    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount = async () => {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  };
  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }
  handleBackButtonClick() {
    BackHandler.exitApp();
    return true;
  }

  handlePhoneNumberChange = phonenumber => {
    this.setState({phonenumber});
  };

  _gotoDriverLogin = () => {
    Keyboard.dismiss();
    this.setState({loading: true});
    var data = {};

    data['phoneNumber'] = this.state.phonenumber;
    data['password'] = this.state.passWord;
    data['deviceId'] = DeviceInfo.getDeviceId();
    data['deviceType'] = DeviceInfo.getDeviceType();

    var headers = Constants.HEADERS;
    var obj = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        deviceId: DeviceInfo.getDeviceId(),
        'api-version': 'V3',
      },
      body: JSON.stringify(data),
    };
    var url = Constants.SERVER_CALL + 'login';
    console.log('====================================');
    console.log(url);
    console.log('====================================');

    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log('====================================');

        console.log(json);
        console.log('json');
        console.log('====================================');

        if (json != null) {
          var obj = json.data;
          console.log(obj);
          console.log('obj');

          this.setState({loading: false});
          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            await AsyncStorage.setItem('USER', JSON.stringify(json));

            ToastAndroid.show(json.message, ToastAndroid.SHORT);

            if (obj != null && obj != '') {
              if (obj.resetPassword == 'COMPLETED') {
                this.props.navigation.push('AppStackScreen', {
                  screen: 'DashBoard',
                });
              } else {
                this.props.navigation.push('AuthStackScreen', {
                  screen: 'Password',
                  params: {comeFrom: 'Login'},
                });
              }
            }
          } else if (json.status == 'updated') {
            Alert.alert('Alert !', 'New version updated.', [
              {
                text: 'Download',
                onPress: () => Linking.openURL(json.updatedLink),
              },
            ]);
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

  _gotoAdminLogin = () => {
    this.setState({loading: true});
    var headers = Constants.LOGIN_HEADERS;

    var urlencoded = {
      client_id: 'cs',
      username: this.state.phonenumber,
      password: this.state.passWord,
      grant_type: 'password',
      scope: 'openid',
    };

    var formBody = [];
    for (var property in urlencoded) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(urlencoded[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    formBody = formBody.join('&');

    var requestOptions = {
      method: 'POST',
      headers: headers,
      body: formBody,
      redirect: 'follow',
    };

    fetch(
      'https://gssfeed2.greenko.net/realms/greenkoIntranet/protocol/openid-connect/token',
      requestOptions,
    )
      .then(res => {
        return res.json();
      })
      .then(async json => {
        this.setState({loading: false});
        if (json != '' && json != null) {
          this.setState({loginStatus: json});
          // await AsyncStorage.setItem('ADMIN', JSON.stringify(json));
          await AsyncStorage.setItem('ISLOGOUT', 'FALSE');

          if (json?.error) {
            var msg = json?.error_description || 'Invalid Credentials';
            Alert.alert('alert', msg);
          } else {
            this.setState({loading: false});
            await AsyncStorage.setItem('ADMIN', JSON.stringify(json));

            this._adminNavigation();
          }
        }
      }).catch = error => {
      this.setState({loading: false});
      console.log(error);
    };
  };

  _adminNavigation = async () => {
    try {
      await AsyncStorage.getItem('ADMIN')
        .then(async value => {
          if (value != '' && value != null) {
            var admin = JSON.parse(value);

            var accessToken = admin.access_token;
            var decoded = jwt_decode(accessToken);

            this.setState({
              accessRoles: decoded.resource_access.cs.roles,
            });

            if (
              this.state.accessRoles.includes('cs-housekeeping-admin') &&
              this.state.accessRoles.includes('cs-fleet-admin')
            ) {
              this.setState({modalVisible: true});
            } else {
              if (this.state.accessRoles.includes('cs-housekeeping-admin')) {
                await AsyncStorage.setItem('MODULE', 'HOUSEKEEPING');
                this.props.navigation.push('AppStackScreen', {screen: 'Home'});
              } else if (this.state.accessRoles.includes('cs-fleet-admin')) {
                await AsyncStorage.setItem('MODULE', 'FLEET');
                this.props.navigation.push('AppStackScreen', {screen: 'Home'});
              }
            }
          }
        })
        .done();
    } catch (error) {}
  };

  _validateUser = () => {
    if (isNaN(+this.state.phonenumber)) {
      this._gotoAdminLogin();
    } else {
      this._gotoDriverLogin();
    }
  };

  _roleNavigation = async data => {
    if (data == null) {
      this.setState({modalVisible: false, checked: ''});
      this.props.navigation.push('AuthStackScreen', {
        screen: 'Login',
      });
    } else {
      await AsyncStorage.setItem('MODULE', data);
      this.setState({modalVisible: false, checked: ''});
      this.props.navigation.push('AppStackScreen', {screen: 'Home'});
    }
  };

  render() {
    const {phonenumber, passWord} = this.state;

    return (
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={'handled'}>
        <Image
          style={{
            width: width * 0.74,
            height: 80,
            alignSelf: 'center',
          }}
          resizeMode="contain"
          source={require('../../assets/fleet_logo.png')}
        />

        <View
          style={{
            // padding: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1%',
          }}>
          <Text
            style={{
              fontSize: 20,
              color: '#000',
              padding: 15,
              paddingBottom: 20,
              fontWeight: '500',
            }}>
            Login
          </Text>

          <TextInput
            value={this.state.phonenumber}
            onChangeText={this.handlePhoneNumberChange}
            label="Phone Number / User Name"
            variant="outlined"
            color="#808B96"
            style={{width: width * 0.7, color: '#000', fontSize: 14}}
          />

          <View style={{paddingTop: 15}}>
            <View
              style={[
                {
                  flexDirection: 'row',
                },
              ]}>
              <TextInput
                value={this.state.passWord}
                label="Password"
                variant="outlined"
                color="#808B96"
                placeholderTextColor="#444"
                secureTextEntry={this.state.secureTextEntry}
                onChangeText={text => {
                  this.setState({passWord: text});
                }}
                style={{width: width * 0.7, fontSize: 16}}
                trailing={props => (
                  <View>
                    {this.state.secureTextEntry ? (
                      <EIcon
                        name="eye-with-line"
                        color="#000"
                        size={20}
                        onPress={() =>
                          this.setState({
                            secureTextEntry: !this.state.secureTextEntry,
                          })
                        }
                      />
                    ) : (
                      <EIcon
                        name="eye"
                        color="#000"
                        size={20}
                        onPress={() =>
                          this.setState({
                            secureTextEntry: !this.state.secureTextEntry,
                          })
                        }
                      />
                    )}
                  </View>
                )}
              />
            </View>
          </View>
          {this.state.errorMsg ? (
            <Text style={{color: 'red', textAlign: 'center'}}>
              Invalid credential
            </Text>
          ) : null}

          <TouchableOpacity
            disabled={
              !passWord != '' && !passWord != null && passWord.length <= 6
            }
            onPress={() => this._validateUser()}>
            <View
              style={[
                styles.btn,
                {
                  backgroundColor:
                    passWord != '' && passWord != null && passWord.length >= 4
                      ? '#0ba6ff'
                      : '#ccc',
                  marginTop: '2%',
                  width: width * 0.7,
                },
              ]}>
              <Text style={[styles.btn_text, {color: '#fff'}]}>Login</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginTop: 8,
              paddingRight: 2,
            }}
            onPress={() =>
              this.props.navigation.push('AppStackScreen', {
                screen: 'RqPassword',
              })
            }>
            <Text style={[styles.btn_text, {color: '#000'}]}>
              Forgot Password ?
            </Text>
          </TouchableOpacity>
        </View>

        <SModal
          testID="modal"
          animationInTiming={500}
          isVisible={this.state.modalVisible}
          onBackdropPress={() => console.log('out of box pressed')}
          swipeDirection={['up', 'left', 'right', 'down']}
          style={{justifyContent: 'center', margin: 0}}
          animationOutTiming={1000}
          backdropTransitionInTiming={800}
          backdropTransitionOutTiming={800}
          onBackButtonPress={() =>
            this.setState({modalVisible: !this.state.modalVisible})
          }>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              padding: 20,
              margin: '4%',
              borderRadius: 6,
            }}>
            <View style={{flexDirection: 'row'}}>
              <View style={{width: width * 0.8}}>
                <Text
                  style={{
                    color: '#000',
                    fontSize: 18,
                    padding: 10,
                    fontWeight: '800',
                    paddingBottom: 20,
                    textAlign: 'center',
                  }}>
                  {' '}
                  Select Module
                </Text>
              </View>

              <IIcon
                name="close"
                color={'#000'}
                size={25}
                onPress={() =>
                  this.setState({modalVisible: !this.state.modalVisible})
                }
              />
            </View>

            <RadioButton.Group>
              <View style={{margin: '4%'}}>
                <View
                  style={{
                    flexDirection: 'row',
                    // justifyContent: 'center',
                    alignItems: 'center',
                    paddingRight: '15%',
                  }}>
                  <RadioButton
                    value="FLEET"
                    status={
                      this.state.checked === 'FLEET' ? 'checked' : 'unchecked'
                    }
                    onPress={() => this.setState({checked: 'FLEET'})}
                  />
                  <Text
                    style={{fontSize: 14, fontWeight: '600', color: '#000'}}>
                    FLEET
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <RadioButton
                    value="HOUSEKEEPING"
                    status={
                      this.state.checked === 'HOUSEKEEPING'
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() => this.setState({checked: 'HOUSEKEEPING'})}
                  />
                  <Text
                    style={{fontSize: 14, fontWeight: '600', color: '#000'}}>
                    HOUSEKEEPING
                  </Text>
                </View>
              </View>
            </RadioButton.Group>

            <TouchableOpacity
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: this.state.checked ? '#3498DB' : '#ccc',
                marginTop: 10,
                borderRadius: 4,
              }}
              disabled={!this.state.checked}
              onPress={() => this._roleNavigation(this.state.checked)}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 14,
                  padding: 8,
                  color: '#fff',
                }}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </SModal>

        <Loader loading={this.state.loading} />
      </KeyboardAwareScrollView>
    );
  }
}
