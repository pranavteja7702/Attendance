import React, {Component} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  BackHandler,
  TextInput,
  Alert,
  StyleSheet,
  Modal,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from '../../Constants';
import Loader from '../../Loader';
import styles from '../../styles';
const {height, width} = Dimensions.get('window');
import MIcon from 'react-native-vector-icons/MaterialIcons';
import FIcon from 'react-native-vector-icons/Fontisto';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import EnIcon from 'react-native-vector-icons/Entypo';
import {FAB, Badge} from 'react-native-paper';
import FaIcon from 'react-native-vector-icons/FontAwesome';
import jwt_decode from 'jwt-decode';
import {apiCall} from '../../CommonServices';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adminName: '',
      Token: '',
      mainData: {},
      loading: false,
      attendenceData: [],
      fromDate: moment().format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
      visibleCalendar: false,
      visibleCalendar1: false,
      driverslist: '',
      drivers: [],
      userID: '',
      modalVisible: false,
      emptyAttendance: false,
      refreshToken: '',
      tokenExpiresin: '',
      refreshTokenExpires: '',
      accessModule: '',
      isLogin: false,
    };

    try {
      AsyncStorage.getItem('MODULE').then(module => {
        if (module != '' && module != null) {
          console.log(
            module,
            '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
          );
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
            console.log(admin);
            var accessToken = admin.access_token;
            var decoded = jwt_decode(accessToken);
            console.log('admin');

            this.setState(
              {
                adminName: decoded.name,
                Token: accessToken,
                refreshToken: admin.refresh_token,
                tokenExpiresin: decoded.exp,
                refreshTokenExpires: admin.refresh_expires_in,
              },
              () => this._dashBoardData(),
              this._driversData(),
              this._drivers(),
            );
          }
        })
        .done();
    } catch (error) {}
    this.timer1 = null;

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
    BackHandler.exitApp();
    return true;
  }

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._dashBoardData();
      this._drivers();
      this._driversData();
      this.setState({
        refreshing: false,
        fromDate: moment().format('YYYY-MM-DD'),
        toDate: moment().format('YYYY-MM-DD'),
        driverID: '',
      });
    }, 2000);
  };

  _generateNewtoken = async () => {
    console.log('Home');

    const logout = await AsyncStorage.getItem('ISLOGOUT');

    if (this.state.tokenExpiresin < Date.now() / 1000 && logout == 'FALSE') {
      console.log('1');

      if (this.state.refreshTokenExpires < Date.now() / 1000) {
        this.setState({isLogin: false});
        console.log('2..................');

        this._getAccesstoken();
      } else {
        console.log('2');
        this._logOut();
      }
    }
  };

  _getAccesstoken = () => {
    this.setState({isLogin: false});

    console.log('tokennnnnnnnnnnnnnnnnnnnnnnnnnnnnnn');
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
        if (json?.error == 'invalid_grant') {
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
    console.log('logout...........');
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
      }).catch = error => {
      this.setState({loading: false});
      console.log(error);
    };
  };

  _dashBoardData = async () => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'dashBoardData',
        'GET',
        null,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      console.log(resp, '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({mainData: resp.Count});
      } else {
        this.setState({loading: false});
        Alert.alert('Alert !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Alert !', 'Something went wrong please try later.', [
        {
          text: 'OK',
          onPress: () =>
            this.props.navigation.navigate('AuthStackScreen', {
              screen: 'Login',
            }),
        },
      ]);
    }
  };

  _driversData = async () => {
    this.setState({loading: true, attendenceData: []});

    try {
      const resp = await apiCall(
        'getDrivercheckInData?fromDate=' +
          moment(this.state.fromDate).format('YYYY-MM-DD') +
          '&toDate=' +
          moment(this.state.toDate).format('YYYY-MM-DD') +
          '&type=getData&usersId=' +
          this.state.userID,
        'GET',
        null,
        this.state.Token,
        this.state.accessModule,
      );
      console.log(resp.data);
      console.log('driverData');

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      this.setState({loading: false});
      if (resp != '' && resp != null && resp.status == 'success') {
        if (resp.data.length > 0) {
          this.setState({
            attendenceData: resp.data,

            driverslist: '',
            emptyAttendance: false,
          });
        } else {
          this.setState({emptyAttendance: true});
        }
      } else if (resp.status == 'error') {
        Alert.alert('Alert !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Alert !', 'Something went wrong please try later.', [
        {
          text: 'OK',
          onPress: () =>
            this.props.navigation.navigate('AuthStackScreen', {
              screen: 'Login',
            }),
        },
      ]);
    }
  };

  _drivers = async () => {
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

      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({drivers: resp.data});
      } else {
        this.setState({loading: false});
        Alert.alert('Alert !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Alert !', 'Something went wrong please try later.', [
        {
          text: 'OK',
          onPress: () =>
            this.props.navigation.navigate('AuthStackScreen', {
              screen: 'Login',
            }),
        },
      ]);
    }
  };

  setDate = (event, value) => {
    var dateSelected = moment(value).format('YYYY-MM-DD');
    this.setState({
      visibleCalendar: !this.state.visibleCalendar,
    });

    this.setState({fromDate: dateSelected, toDate: dateSelected});
  };

  setDate1 = (event, value) => {
    var dateSelected = moment(value).format('YYYY-MM-DD');
    this.setState({
      visibleCalendar1: !this.state.visibleCalendar1,
    });

    this.setState({toDate: dateSelected});
  };

  _alertLogout = () => {
    Alert.alert(
      'Alert',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => this._logOut()},
      ],
      {cancelable: false},
    );
  };
  _unassign = drivers => {
    if (drivers != '' && drivers != null && drivers == 'all') {
      this.setState({
        driverID: '',
      });
    } else {
      this.setState({driverslist: drivers.name, userID: drivers.usersId});
    }
  };

  _toggleFilterModal() {
    this.setState({modalVisible: !this.state.modalVisible});
  }

  _unassignLocationApproval = async (attdId, status) => {
    this.setState({loading: true});
    try {
      var data = {};
      data['attdId'] = attdId;
      data['attdStatus'] = status;
      const resp = await apiCall(
        'updateDriverattendence',
        'POST',
        data,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({loading: false});
        ToastAndroid.show(resp.message, ToastAndroid.LONG);
        this._driversData();
      } else {
        Alert.alert('Alert !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Alert !', 'Something went wrong please try later.', [
        {
          text: 'OK',
          onPress: () =>
            this.props.navigation.navigate('AuthStackScreen', {
              screen: 'Login',
            }),
        },
      ]);
    }
  };

  renderDailyattendence = data => {
    var data = data.item;
    return (
      <View
        style={{
          marginTop: '1%',
          backgroundColor: '#fff',
          elevation: 4,
          borderRadius: 10,
          padding: 10,
          width: width * 0.93,
          alignSelf: 'center',
          marginBottom: '1%', // margin: 10,
        }}>
        <View style={{flexDirection: 'row', padding: 6, alignItems: 'center'}}>
          <View
            style={{
              width: width * 0.5,
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: '1%',
            }}>
            <MIcon name="account-circle" color={'#000'} size={25} />
            <Text
              style={{
                ...styles.profileText,
              }}
              numberOfLines={1}
              ellipsizeMode="tail">
              {data.userName}
            </Text>
          </View>
          {data.duration != null && data.duration != '' ? (
            <View
              style={{
                flexDirection: 'row',
                paddingLeft: 10,
                width: width * 0.4,
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  backgroundColor: '#F9E79F',
                  elevation: 4,
                  borderRadius: 60,
                  marginRight: 10,
                  padding: 3,
                  alignItems: 'center',
                }}>
                <MIcon name="access-time" color={'#9A7D0A'} size={14} />
              </View>
              <Text
                style={{
                  ...styles.latlonText,
                  color: '#000',
                }}>
                {''}

                <Text
                  style={{
                    ...styles.profileText,
                    color: '#000',
                    fontSize: 14,
                  }}>
                  {Math.floor(data.duration / 60) +
                    'h' +
                    ' : ' +
                    (data.duration % 60) +
                    'm'}
                </Text>
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{padding: 6}}>
          {data.checkIn != '' && data.checkIn != null ? (
            <View
              style={{
                backgroundColor: '#fff',
                // alignItems: 'center',
                // elevation: 4,
                borderRadius: 8,
                padding: 8,
                paddingRight: 8,
                borderWidth: 1,
                borderColor: '#ccc',
                width: width * 0.82,
                // flexDirection: 'row',
              }}>
              <View
                style={{
                  marginRight: 4,
                  flexDirection: 'row',
                }}>
                <Text
                  style={{
                    ...styles.latlonText,
                    color: 'green',
                    paddingLeft: 10,
                    paddingRight: 10,
                  }}>
                  IN
                </Text>
                <Text
                  style={{
                    ...styles.latlonText,
                    color: '#000',
                    fontWeight: '500',
                  }}>
                  {''}
                  {moment(data.checkIn).utc().format('DD MMM YYYY')}
                </Text>

                <Text
                  style={{
                    ...styles.latlonText,
                    color: '#000',
                    paddingLeft: 12,
                    fontWeight: '500',
                  }}>
                  {moment(new Date(data.checkIn)).utc().format('LT')}
                </Text>
              </View>

              {data.hasOwnProperty('checkInData') && (
                <View
                  style={{
                    padding: 6,
                    flexDirection: 'row',
                    // justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <FIcon name="map-marker-alt" color={'#000'} size={18} />

                  <Text
                    style={{
                      ...styles.latlonText,
                      color: '#000',
                      paddingLeft: 12,
                      fontWeight: '500',
                    }}>
                    {data.checkInData.locationName}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {data.checkOut != '' && data.checkOut != null ? (
            <View
              style={{
                backgroundColor: '#fff',
                // alignItems: 'center',
                // elevation: 4,
                borderRadius: 8,
                padding: 8,
                paddingRight: 8,
                borderWidth: 1,
                borderColor: '#ccc',
                width: width * 0.82,
                marginTop: '2%',
              }}>
              <View
                style={{
                  marginRight: 5,
                  flexDirection: 'row',
                  // justifyContent: 'center',
                }}>
                <View
                  style={{
                    // justifyContent: 'flex-start',
                    // alignSelf: 'flex-start',
                    alignItems: 'center',
                    width: width * 0.5,
                    flexDirection: 'row',
                  }}>
                  <Text
                    style={{
                      ...styles.latlonText,
                      color: 'red',
                      paddingLeft: 4,
                      paddingRight: 4,
                    }}>
                    OUT
                  </Text>
                  <Text
                    style={{
                      ...styles.latlonText,
                      color: '#000',
                      fontWeight: '500',
                    }}>
                    {''}
                    {moment(data.checkOut).utc().format('DD MMM YYYY')}
                  </Text>
                  <Text
                    style={{
                      ...styles.latlonText,
                      color: '#000',
                      paddingLeft: 12,
                      fontWeight: '500',
                    }}>
                    {moment(new Date(data.checkOut)).utc().format('LT')}
                  </Text>
                </View>

                {data.attdStatus == 'CHECKED_OUT_NEED_APPROVAL' ? (
                  <View
                    style={{
                      alignSelf: 'flex-end',
                      padding: 5,
                      flexDirection: 'row',
                    }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#58D68D',
                        padding: 8,
                        elevation: 4,
                        marginRight: 10,
                        borderRadius: 20,
                      }}
                      onPress={() =>
                        this._unassignLocationApproval(data.attdId, 'APPROVED')
                      }>
                      <FaIcon name="check" color={'#fff'} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#F1948A',
                        padding: 8,
                        elevation: 4,
                        marginRight: 0,
                        borderRadius: 20,
                      }}
                      onPress={() =>
                        this._unassignLocationApproval(data.attdId, 'REJECTED')
                      }>
                      <EnIcon name="cross" color={'#fff'} size={20} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {data.hasOwnProperty('checkOutData') && (
                <View
                  style={{
                    padding: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <FIcon name="map-marker-alt" color={'#000'} size={18} />

                  <Text
                    style={{
                      ...styles.latlonText,
                      color: '#000',
                      paddingLeft: 12,
                      fontWeight: '500',
                    }}>
                    {data.checkOutData.locationName}
                  </Text>
                </View>
              )}

              {data.attdStatus == 'CHECKED_OUT_REJECTED' ? (
                <View
                  style={{
                    padding: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      // ...styles.latlonText,
                      color: 'red',
                      fontWeight: '500',
                      textAlign: 'center',
                    }}>
                    Check Out Rejected{' '}
                  </Text>
                </View>
              ) : null}

              {data.attdStatus == 'CHECKED_OUT_APPROVED' ? (
                <View
                  style={{
                    padding: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      // ...styles.latlonText,
                      color: 'green',
                      fontWeight: '500',
                      textAlign: 'center',
                    }}>
                    Check Out Approved{' '}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };
  _toggleFilterModal() {
    this.setState({modalVisible: !this.state.modalVisible});
  }

  render() {
    console.log(this.state.accessModule);
    return (
      <SafeAreaView style={StyleSheet.absoluteFill}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 10,
            width: width,
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: 10,
          }}>
          <View style={{marginLeft: '1%', width: width * 0.8}}>
            <Image
              source={require('../../assets/greenko1.png')}
              style={{width: width * 0.48, height: 45}}
              resizeMode="contain"
            />
          </View>

          <View style={{width: width * 0.15}}>
            <TouchableOpacity
              style={{alignItems: 'center', justifyContent: 'center'}}
              onPress={() => this._alertLogout()}>
              <MIcon
                name="power-settings-new"
                color={'#000'}
                size={25}
                style={{}}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps={'handled'}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.onRefresh()}
            />
          }>
          <View
            style={{
              paddingHorizontal: 10,
              flexDirection: 'row',
              top: 5,
              left: 4,
            }}>
            <MIcon name="account-circle" color={'#000'} size={25} />

            <Text style={{fontSize: 16, fontWeight: '500', paddingLeft: 10}}>
              {this.state.adminName}
            </Text>
          </View>

          <View
            style={{
              width: width * 0.92,
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: '5%',
              flexWrap: 'wrap',
              // margin: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                style={{
                  ...styles.counts,

                  backgroundColor: '#E6B0AA',
                  marginRight: 10,
                  height: 210,
                  alignItems: 'center',
                }}
                onPress={() =>
                  this.props.navigation.push('AppStackScreen', {
                    screen: 'Drivers',
                  })
                }>
                {this.state.accessModule == 'HOUSEKEEPING' ? (
                  <Image
                    source={require('../../assets/person.png')}
                    style={{width: 60, height: 60, marginBottom: '4%'}}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={require('../../assets/fleet-car.png')}
                    style={{width: 80, height: 80}}
                    resizeMode="contain"
                  />
                )}
                {this.state.accessModule == 'HOUSEKEEPING' ? (
                  <Text style={[styles.countsText, {color: '#A93226'}]}>
                    Users
                  </Text>
                ) : (
                  <Text style={[styles.countsText, {color: '#A93226'}]}>
                    Drivers
                  </Text>
                )}
                <Text
                  style={[
                    styles.countsText,
                    {color: '#A93226', fontSize: 24, paddingTop: 5},
                  ]}>
                  {this.state.mainData.DriverCount}
                </Text>
              </TouchableOpacity>
              <View style={{flexDirection: 'column'}}>
                <TouchableOpacity
                  style={[
                    styles.counts,
                    {
                      backgroundColor: '#008080',
                    },
                  ]}
                  onPress={() =>
                    this.props.navigation.push('AppStackScreen', {
                      screen: 'AssignDriver',
                    })
                  }>
                  {this.state.accessModule == 'HOUSEKEEPING' ? (
                    <Text style={[styles.countsText, {color: '#fff'}]}>
                      Assigned Users
                    </Text>
                  ) : (
                    <Text style={[styles.countsText, {color: '#fff'}]}>
                      Assigned Drivers
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.countsText,
                      {color: '#fff', fontSize: 24, paddingTop: 5},
                    ]}>
                    {this.state.mainData.AssignedToLocationCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.counts,
                    {
                      marginTop: 10,
                      backgroundColor: '#85C1E9',
                    },
                  ]}
                  onPress={() =>
                    this.props.navigation.push('AppStackScreen', {
                      screen: 'AddLocation',
                    })
                  }>
                  <Text style={[styles.countsText, {color: '#1B4F72'}]}>
                    Locations
                  </Text>
                  <Text
                    style={[
                      styles.countsText,
                      {color: '#1B4F72', fontSize: 24, paddingTop: 5},
                    ]}>
                    {this.state.mainData.LocationCount}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 13,
              }}>
              <TouchableOpacity
                disabled={!Number(this.state.mainData.pendingCount) > 0}
                style={[
                  styles.counts,
                  {
                    backgroundColor:
                      Number(this.state.mainData.pendingCount) > 0
                        ? '#A9DFBF'
                        : '#ddd',
                  },
                ]}
                onPress={() =>
                  this.props.navigation.push('AppStackScreen', {
                    screen: 'Leaves',
                  })
                }>
                <Text
                  style={[
                    styles.countsText,
                    {
                      color:
                        Number(this.state.mainData.pendingCount) > 0
                          ? '#196F3D'
                          : '#aaa',
                    },
                  ]}>
                  Leaves
                </Text>

                <Text
                  style={{
                    ...styles.countsText,
                    fontSize: 24,
                    color:
                      Number(this.state.mainData.pendingCount) > 0
                        ? '#196F3D'
                        : '#aaa',
                  }}>
                  {this.state.mainData.pendingCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={Number(this.state.mainData.futureLeaves) == 0}
                style={[
                  styles.counts,
                  {
                    backgroundColor:
                      Number(this.state.mainData.futureLeaves) > 0
                        ? '#D2B4DE'
                        : '#ddd',
                    marginLeft: 10,
                  },
                ]}
                onPress={() =>
                  this.props.navigation.push('AppStackScreen', {
                    screen: 'LeaveNotifications',
                  })
                }>
                <Text
                  style={[
                    styles.countsText,
                    {
                      color:
                        Number(this.state.mainData.futureLeaves) > 0
                          ? '#7D3C98'
                          : '#aaa',
                    },
                  ]}>
                  Future Leaves
                </Text>
                <Text
                  style={[
                    styles.countsText,
                    {
                      color:
                        Number(this.state.mainData.futureLeaves) > 0
                          ? '#7D3C98'
                          : '#aaa',
                      fontSize: 24,
                      paddingTop: 10,
                    },
                  ]}>
                  {this.state.mainData.futureLeaves}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!this.state.emptyAttendance ? (
            <FlatList
              data={this.state.attendenceData}
              renderItem={this.renderDailyattendence}
              keyExtractor={(item, index) => index.toString()}
              style={{marginTop: 10}}
            />
          ) : (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10%',
              }}>
              <Text style={{fontSize: 18, color: '#000'}}>
                {' '}
                No attendance marked
              </Text>
            </View>
          )}

          {this.state.visibleCalendar ? (
            <RNDateTimePicker
              mode="date"
              value={new Date()}
              maximumDate={
                new Date(moment().add(30, 'days').format('YYYY-MM-DD'))
              }
              positiveButton={{label: 'OK', textColor: 'green'}}
              negativeButton={{label: 'Cancel', textColor: 'red'}}
              onChange={this.setDate}
            />
          ) : null}

          {this.state.visibleCalendar1 ? (
            <RNDateTimePicker
              mode="date"
              value={new Date()}
              positiveButton={{label: 'OK', textColor: 'green'}}
              negativeButton={{label: 'Cancel', textColor: 'red'}}
              onChange={this.setDate1}
            />
          ) : null}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          style={{
            alignSelf: 'flex-end',
            justifyContent: 'flex-end',
            bottom: 0,
          }}
          onRequestClose={() => {
            this._toggleFilterModal();
          }}>
          <View style={styles.centeredView}>
            <View style={{...styles.modalView, backgroundColor: '#AED6F1'}}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  backgroundColor: '#2874A6',
                  padding: 6,
                  marginBottom: 5,
                  borderRadius: 30,
                  elevation: 4,
                }}
                onPress={() =>
                  this.setState({modalVisible: !this.state.modalVisible})
                }>
                <EnIcon name="cross" color={'#fff'} size={25} />
              </TouchableOpacity>
              <View
                style={{
                  padding: 8,
                  marginTop: '8%',
                  marginBottom: '2%',
                  borderRadius: 8,
                  alignSelf: 'center',
                  width: width * 0.92,
                  paddingTop: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: '4%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    style={[styles.fromtoDateView, {}]}
                    onPress={() => this.setState({visibleCalendar: true})}>
                    <View
                      style={{width: width * 0.33, backgroundColor: '#AED6F1'}}>
                      <Text style={[styles.fromTodateText, {color: '#000'}]}>
                        From :{' '}
                      </Text>

                      <Text
                        style={{
                          ...styles.fromTodateText,
                          color: '#21618C',
                          fontSize: 16,
                          fontWeight: '700',
                        }}>
                        {this.state.fromDate}
                      </Text>
                    </View>
                    <FIcon name="date" color={'#1A5276'} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{...styles.fromtoDateView, marginLeft: 5}}
                    onPress={() => this.setState({visibleCalendar1: true})}>
                    <View style={{width: width * 0.33}}>
                      <Text style={[styles.fromTodateText, {color: '#000'}]}>
                        To :{' '}
                      </Text>

                      <Text
                        style={{
                          ...styles.fromTodateText,
                          color: '#21618C',
                          fontSize: 16,
                          fontWeight: '700',
                        }}>
                        {this.state.toDate}
                      </Text>
                    </View>
                    <FIcon name="date" color={'#1A5276'} size={20} />
                  </TouchableOpacity>
                </View>

                {/* <View
                  style={{
                    ...styles.dropdownView,
                    width: width * 0.92,
                    marginTop: '2%',
                    backgroundColor: '#AED6F1',
                    borderRadius: 8,
                    alignSelf: 'center',
                    backgroundColor: '#D6EAF8',
                    elevation: 4,
                  }}>
                  <Picker
                    mode="dropdown"
                    placeholder="--Select--"
                    selectedValue={this.state.driverslist}
                    onValueChange={itemValue => this._unassign(itemValue)}>
                   
                    <Picker.Item
                      label="All"
                      value={'all'}
                      style={{color: '#21618C', fontWeight: '600'}}
                    />
                    {this.state.drivers.map(item => {
                    
                      return (
                        <Picker.Item label={item.name} value={item.name} />
                      );
                    })}
                  </Picker>
                </View> */}

                {this.state.fromDate != '' &&
                this.state.fromDate != null &&
                this.state.toDate != '' &&
                this.state.toDate != null ? (
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      {
                        width: width * 0.4,
                        backgroundColor: '#2874A6',
                        padding: 10,
                        justifyContent: 'center',
                        alignSelf: 'center',
                        marginTop: 10,
                        // padding: 18,
                      },
                    ]}
                    onPress={() =>
                      this.setState(
                        {modalVisible: !this.state.modalVisible},
                        () => this._driversData(),
                      )
                    }>
                    <Text
                      style={{
                        ...styles.latlonText,
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: 18,
                      }}>
                      submit
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
        <FAB
          icon="filter"
          color="#fff"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 2,
            backgroundColor: '#8E44AD',
          }}
          onPress={() =>
            this.setState({modalVisible: !this.state.modalVisible})
          }
        />
        <Text style={{textAlign: 'center'}}>
          {' '}
          app vesrion {''}
          1.2
        </Text>
        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
