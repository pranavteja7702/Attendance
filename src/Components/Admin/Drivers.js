import React, {Component} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  ToastAndroid,
  Modal,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from '../../Constants';
import Loader from '../../Loader';
import styles from '../../styles';
import IIcon from 'react-native-vector-icons/Ionicons';
const {height, width} = Dimensions.get('window');
import MIcon from 'react-native-vector-icons/MaterialIcons';
import {FAB, Appbar} from 'react-native-paper';
import {TextInput} from '@react-native-material/core';
import SearchInput, {createFilter} from 'react-native-search-filter';
const KEYS_TO_FILTERS = ['name', 'phoneNumber'];
import jwt_decode from 'jwt-decode';

import {apiCall} from '../../CommonServices';
export default class Drivers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adminName: '',
      Token: '',
      driversData: [],
      loading: false,
      driverID: '',
      modalVisible: false,
      cellNumber: '',
      driverName: '',
      searchTerm: '',
      searchVisible: false,
      isValid: false,
      refreshToken: '',
      tokenExpiresin: '',
      refreshTokenExpires: '',
      accessModule: '',
      isLogin: false,
      accessModule: '',
      dataFromAPI1: [],
    };

    try {
      AsyncStorage.getItem('MODULE').then(module => {
        if (module != '' && module != null) {
          console.log(module);
          var module = module;

          this.setState({
            accessModule: module,
          });
        }
      });
      AsyncStorage.getItem('ADMIN')
        .then(value => {
          if (value != '' && value != null) {
            var admin = JSON.parse(value);
            var accessToken = admin.access_token;
            var decoded = jwt_decode(accessToken);
            this.setState({
              adminName: decoded.given_name,
              Token: accessToken,
              refreshToken: admin.refresh_token,
              tokenExpiresin: decoded.exp,
              refreshTokenExpires: admin.refresh_expires_in,
            });
          }
          this._driversData();
        })
        .done();
    } catch (error) {}

    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount = async () => {
    var logout = await AsyncStorage.getItem('ISLOGOUT');
    console.log(logout);
    console.log('logout');

    if (logout == 'FALSE') {
      this.timer1 = setInterval(() => {
        this._generateNewtoken();
      }, 10000);
    }
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  };
  componentWillUnmount() {
    clearInterval(this.timer1);

    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }
  handleBackButtonClick() {
    this.props.navigation.navigate('AppStackScreen', {screen: 'Home'});
    return true;
  }
  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._driversData();

      this.setState({refreshing: false});
    }, 2000);
  };

  _generateNewtoken = async () => {
    console.log('Home');

    const logout = await AsyncStorage.getItem('ISLOGOUT');

    if (this.state.tokenExpiresin < Date.now() / 1000 && logout == 'FALSE') {
      console.log('1');

      if (this.state.refreshTokenExpires < Date.now() / 1000) {
        console.log('2..................');

        this._getAccesstoken();
      } else {
        this.setState({isLogin: true});
        console.log('2');
        this._logOut();
      }
    }
  };

  _getAccesstoken = () => {
    console.log(this.state.refreshToken);
    console.log('****************hhhhhhhhhhhhhhh**************');

    var headers = Constants.LOGIN_HEADERS;

    var urlencoded = {
      client_id: 'cs',
      refresh_token: this.state.refreshToken,
      grant_type: 'refresh_token',
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
    var url =
      'https://gssfeed2.greenko.net/realms/greenkoIntranet/protocol/openid-connect/token';
    fetch(url, requestOptions)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log(json);
        console.log('json.........home..........');
        this.setState({loading: false});
        if (json.error == 'invalid_grant') {
          this._logOut();
        } else if (json != '' && json != null) {
          await AsyncStorage.setItem('ADMIN', JSON.stringify(json));
        }
      }).catch = error => {
      this.setState({loading: false});
      console.log(error);
    };
  };

  _logOut = async () => {
    console.log(this.state.refreshToken);
    this.setState({loading: true});
    await AsyncStorage.setItem('ISLOGOUT', 'TRUE');

    var headers = Constants.LOGIN_HEADERS;

    var urlencoded = {
      client_id: 'geps',
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

    console.log(requestOptions);
    fetch(
      'https://gssfeed2.greenko.net/realms/greenkoIntranet/protocol/openid-connect/logout',
      requestOptions,
    )
      .then(res => {
        console.log(res);
        return res.text();
      })
      .then(async text => {
        console.log(text);
        console.log('json.......................................');

        this.setState({loading: false});

        // if (text == '' && text == null) {
        await AsyncStorage.removeItem('ADMIN');
        await AsyncStorage.removeItem('MODULE');

        this.props.navigation.push('AuthStackScreen', {screen: 'Login'});
        // this._adminNavigation();
        // if (json?.error) {
        //   var msg = json?.error_description || 'Invalid Credentials';
        //   Alert.alert('alert', msg);
        // } else {
        //   this.setState({loading: false});
        // }
        //}
      }).catch = error => {
      this.setState({loading: false});
      console.log(error);
    };
  };

  _resetPassword = async phoneNumber => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'regeneratePassword?phoneNumber=' + phoneNumber,
        'GET',
        null,
        this.state.Token,
        this.state.accessModule,
      );
      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';
      console.log(resp, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      if (resp.status == 'error') {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      } else {
        this._driversData();
        ToastAndroid.show(resp.message, ToastAndroid.SHORT);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert(
        'Warning !',
        'Something went wrong please try later............',
        [
          {
            text: 'OK',
            onPress: () =>
              this.props.navigation.navigate('AuthStackScreen', {
                screen: 'Login',
              }),
          },
        ],
      );
    }
  };

  _driversData = async () => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'getUsers',
        'GET',
        null,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      if (resp.status == 'error') {
        this.setState({loading: false});
      } else {
        var obj = resp.data;
        console.log(
          obj,
          '.......................................qwertuiop.......................................................',
        );
        if (obj != '' && obj != null) {
          this.setState({loading: false});
          this.setState({driversData: resp.data});
        }
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert(
        'Warning !',
        'Something went wrong please try later............',
        [
          {
            text: 'OK',
            onPress: () =>
              this.props.navigation.navigate('AuthStackScreen', {
                screen: 'Login',
              }),
          },
        ],
      );
    }
  };

  _driversDelete = async driverId => {
    this.setState({loading: true});
    try {
      const resp = await apiCall(
        'deleteUser/' + driverId,
        'DELETE',
        null,
        this.state.Token,
        this.state.accessModule,
      );
      console.log(resp, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';
      if (resp != null && resp != '' && resp.status == 'success') {
        this._driversData();
        ToastAndroid.show(resp.message, ToastAndroid.SHORT);
      } else {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert(
        'Warning !',
        'Something went wrong please try later............',
        [
          {
            text: 'OK',
            onPress: () =>
              this.props.navigation.navigate('AuthStackScreen', {
                screen: 'Login',
              }),
          },
        ],
      );
    }
  };

  _alertDriver = driverId => {
    Alert.alert('Warning !', 'Are you sure want to delete ?', [
      {
        text: 'OK',
        onPress: () => this._driversDelete(driverId),
      },
      {
        text: 'cancel',
        onPress: () => console.log('cancel pressed'),
      },
    ]);
  };

  _addDriver = async () => {
    this.setState({loading: true});

    try {
      var data = {};
      data['name'] = this.state.driverName.trim();
      data['phoneNumber'] = this.state.cellNumber;
      data['createdBy'] = this.state.adminName;
      const resp = await apiCall(
        'addUser',
        'POST',
        data,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      console.log(
        resp,
        headers,
        'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      );
      if (resp.status == 'error') {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      } else {
        this.setState({loading: false});
        ToastAndroid.show(resp.message, ToastAndroid.SHORT);

        this._driversData();
        this.setState({
          modalVisible: !this.state.modalVisible,
          cellNumber: '',
          driverName: '',
          searchTerm: '',
        });
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert(
        'Warning !',
        'Something went wrong please try later............',
        [
          {
            text: 'OK',
            onPress: () =>
              this.props.navigation.navigate('AuthStackScreen', {
                screen: 'Login',
              }),
          },
        ],
      );
    }
  };

  renderDrivers = data => {
    var data = data.item;
    // console.log(data);
    return (
      <View
        style={{
          marginTop: 10,
          backgroundColor: '#fff',
          elevation: 6,
          borderRadius: 8,
          padding: 8,
          marginLeft: 2,
          marginRight: 2,
          width: width * 0.95,
        }}>
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            alignItems: 'center',
            width: width * 0.9,
          }}>
          <View
            style={{
              flexDirection: 'row',
              width: width * 0.8,
              flexWrap: 'wrap',
            }}>
            <MIcon name="account-circle" color={'#aaa'} size={24} />
            <Text
              style={{
                ...styles.profileText,
                paddingLeft: 10,
                flexWrap: 'wrap',
              }}>
              {data.name}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
            onPress={() => this._alertDriver(data.usersId)}>
            <MIcon name="delete" color={'red'} size={25} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            // justifyContent: 'center',
            alignItems: 'center',
            width: width * 0.79,
            paddingLeft: 4,
            paddingRight: 4,
          }}>
          <MIcon name="call" color={'#aaa'} size={24} />
          <Text
            style={{
              fontSize: 14,
              color: '#000',
              textAlign: 'left',
              paddingLeft: 10,
            }}>
            {data.phoneNumber}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            // justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 2,
          }}>
          <View
            style={{
              justifyContent: 'flex-start',
              paddingLeft: 6,
              width: width * 0.55,
            }}>
            {data.isAssigned == true ? (
              <Text style={styles.statusFlag}>Assigned</Text>
            ) : (
              <Text style={{...styles.statusFlag, color: 'red'}}>
                Not Assigned
              </Text>
            )}
          </View>

          {data.passwordRequest == 'YES' ? (
            <TouchableOpacity
              style={{
                // borderWidth: 1,
                borderRadius: 8,
                // borderColor: '#aaa',
                padding: 4,
                marginTop: 5,
                backgroundColor: '#FAD7A0',
                elevation: 4,
              }}
              onPress={() => this._resetPassword(data.phoneNumber)}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#9C640C',
                  textAlign: 'left',
                  paddingHorizontal: 10,
                }}>
                RESET PASSWORD
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  searchUpdated(term) {
    this.setState({searchTerm: term});
  }

  validateUsername = driverName => {
    const regex = /^[a-zA-Z,0-9. ]{1,100}$/;
    const isValid = regex.test(driverName);
    this.setState({driverName, isValid});
  };

  render() {
    const {modalVisible} = this.state;

    const driversList = this.state.driversData;
    const filteredDrivers = driversList.filter(
      createFilter(this.state.searchTerm, KEYS_TO_FILTERS),
    );

    return (
      <SafeAreaView style={{flex: 1}}>
        <Appbar.Header>
          <Appbar.BackAction
            onPress={() =>
              this.props.navigation.navigate('AppStackScreen', {
                screen: 'Home',
              })
            }
            color="#8E44AD"
          />
          {this.state.accessModule == 'HOUSEKEEPING' ? (
            <Appbar.Content title="Users" titleStyle={styles.headerText} />
          ) : (
            <Appbar.Content title="Drivers" titleStyle={styles.headerText} />
          )}
          <Appbar.Action
            icon="account-search"
            size={30}
            onPress={() => {
              this.setState({
                searchVisible: !this.state.searchVisible,
                modalVisible: false,
              });
            }}
            color="#8E44AD"
          />
        </Appbar.Header>

        {this.state.searchVisible ? (
          <View
            style={{
              flexDirection: 'row',
              marginTop: 10,
              width: width * 0.95,
              alignSelf: 'center',
            }}>
            <SearchInput
              onChangeText={term => {
                this.searchUpdated(term);
              }}
              clearIcon={
                <IIcon
                  name="close-circle-outline"
                  size={30}
                  style={{marginTop: 10, marginLeft: '1%'}}
                  onPress={() =>
                    this.setState({
                      searchVisible: !this.state.searchVisible,
                      searchTerm: '',
                    })
                  }
                />
              }
              clearButtonMode="while-editing"
              clearIconViewStyles={{position: 'absolute', top: 0, right: 5}}
              placeholder="Search driver name / phone number"
              placeholderTextColor={'#000'}
              style={{
                borderRadius: 10,
                height: 50,
                fontSize: 16,
                width: width * 0.95,
                alignSelf: 'center',
                backgroundColor: '#fff',
                elevation: 4,
                paddingLeft: '2%',
              }}
            />
          </View>
        ) : null}

        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: '2%'}}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.onRefresh()}
            />
          }>
          {this.state.modalVisible ? (
            <View style={{...styles.centeredView, width: width * 0.96}}>
              <View style={[styles.modalView1, {marginTop: '2%'}]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                      width: '80%',
                      fontWeight: '800',
                    }}>
                    Add Driver
                  </Text>
                  <IIcon
                    name="close-circle-outline"
                    size={30}
                    color="red"
                    onPress={() =>
                      this.setState({modalVisible: !this.state.modalVisible})
                    }
                  />
                </View>
                <TextInput
                  value={this.state.driverName}
                  onChangeText={this.validateUsername}
                  label="Name"
                  variant="outlined"
                  color="#808B96"
                  style={{
                    width: width * 0.9,
                    color: '#000',
                    fontSize: 16,
                    marginTop: '2%',
                  }}
                />

                {!this.state.isValid && this.state.driverName != '' && (
                  <Text style={{color: 'red'}}>Please enter a valid name.</Text>
                )}

                <TextInput
                  value={this.state.cellNumber}
                  onChangeText={text => {
                    this.setState({cellNumber: text});
                  }}
                  label="Phone Number"
                  variant="outlined"
                  color="#808B96"
                  maxLength={10}
                  keyboardType="numeric"
                  style={{
                    width: width * 0.9,
                    color: '#000',
                    fontSize: 16,
                    marginTop: 5,
                  }}
                />
                {this.state.driverName != null &&
                this.state.driverName != '' &&
                this.state.cellNumber != '' &&
                this.state.cellNumber != null ? (
                  <TouchableOpacity
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                    onPress={() => this._addDriver()}>
                    <View
                      style={[
                        styles.btn,
                        {
                          width: width * 0.9,
                          backgroundColor:
                            this.state.driverName == '' ||
                            this.state.cellNumber == ''
                              ? '#aaa'
                              : '#8E44AD',
                          padding: 10,
                        },
                      ]}>
                      <Text style={[styles.btn_text, {color: '#fff'}]}>
                        Submit
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
          <View
            style={{
              width: width * 0.96,
              justifyContent: 'center',
              alignSelf: 'center',
              // margin: 20,
            }}>
            <View style={{marginBottom: '2%', paddingBottom: '2%'}}>
              {driversList.length > 0 && filteredDrivers.length > 0 ? (
                <FlatList
                  data={filteredDrivers}
                  renderItem={this.renderDrivers}
                  keyExtractor={(item, index) => index.toString()}
                />
              ) : (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                  }}>
                  <Text>No Data Found.</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {!this.state.modalVisible ? (
          <FAB
            icon="plus"
            color="#fff"
            style={{
              position: 'absolute',
              margin: 16,
              right: 0,
              bottom: 0,
              backgroundColor: '#8E44AD',
            }}
            onPress={() =>
              this.setState({
                modalVisible: !modalVisible,
                searchVisible: false,
              })
            }
          />
        ) : null}

        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
