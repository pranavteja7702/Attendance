/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import {
  View,
  Text,
  BackHandler,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ToastAndroid,
  RefreshControl,
  AppState,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../../styles';
import {Surface} from '@react-native-material/core';
import Loader from '../../Loader';
import Constants from '../../Constants';
import moment from 'moment';
import {getDistance} from 'geolib';
import AIcon from 'react-native-vector-icons/AntDesign';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
const {height, width} = Dimensions.get('window');
import IIcon from 'react-native-vector-icons/Ionicons';
import FoIcon from 'react-native-vector-icons/Fontisto';
import {Appbar} from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
const GOOGLE_KEY = 'AIzaSyDsivkqbokA-Mtyl8Uq7bhFgxIaQcUUXtI';

export default class DashBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      assignedLocationData: [],
      attendanceId: '',
      userToken: '',
      driverID: Number,
      usersId: '',
      driverName: '',
      refreshing: false,
      appState: AppState.currentState,
      isLocationAssigned: false,
      CheckOutData: {},
      previousInTime: '',
      previousOutTime: '',
      locationId: 0,
      locationName: '',
      latitude: 0,
      longitude: 0,
      address: '',
      atTheAssignedLocation: false,
      userModule: '',
      userName: '',
      userID: '',
    };
    this._getUserData();
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount() {
    // this.hasLocationPermission();
    // this.appStateSubscription = AppState.addEventListener(
    //   'change',
    //   nextAppState => {
    //     if (
    //       this.state.appState.match(/inactive|background/) &&
    //       nextAppState === 'active'
    //     ) {
    //       this.setState({appState: nextAppState});
    //       // this._getUserData();
    //     } else {
    //       this.setState({appState: nextAppState});
    //       // this._getUserData();
    //     }
    //   },
    // );
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
    BackHandler.exitApp();
    return true;
  }

  _getUserData = () => {
    try {
      AsyncStorage.getItem('USER')
        .then(value => {
          if (value != '' && value != null) {
            var user = JSON.parse(value);
            console.log(user);

            var userData = user.data;

            this.setState({
              userToken: user.Token,
              userID: userData.usersId,
              userName: userData.name,
              userModule: userData.module,
            });
            this._checkAttendance();
          }
        })
        .done();
    } catch (error) {}
  };

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._checkAttendance();

      this.setState({refreshing: false});
    }, 2000);
  };

  _checkAttendance = () => {
    this.setState({loading: true});

    var headers = Constants.HEADERS;
    headers['Authorization'] = 'Token ' + this.state.userToken;
    headers['module'] = this.state.userModule;
    headers['Content-Type'] = 'application/json';
    var obj = {
      method: 'GET',
      headers,
    };

    var url =
      Constants.SERVER_CALL + 'checkAttendance?usersId=' + this.state.userID;
    console.log(url);
    console.log(obj);

    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        this.setState({loading: false});
        console.log(json);
        console.log('json::::::::::::::::::::::::::::::::');

        if (
          json != '' &&
          json != null &&
          json.status == 'success' &&
          json.hasOwnProperty('data')
        ) {
          var obj = json.data;
          this.setState({
            assignedLocationData: obj,
          });

          if (
            obj.hasOwnProperty('logInStatus') &&
            obj.logInStatus == 'CHECKED_IN'
          ) {
            this.setState({
              attendanceId: obj.attdId,
            });
          }
          if (obj.hasOwnProperty('locations') && obj.locations.length > 0) {
            this.setState({isLocationAssigned: true});
            this._getDistanceFromLocation(obj.locations);
          } else {
            this.setState({isLocationAssigned: false});
          }
        } else if (json.status == 'error') {
          Alert.alert('Warning !', json.message);
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

  _getDistanceFromLocation = async location => {
    try {
      const hasLocationPermission = await this.hasLocationPermission();
      if (!hasLocationPermission) {
        return;
      }
      var dis,
        distances = {},
        locId,
        locName;

      Geolocation.getCurrentPosition(
        position => {
          location.map(loc => {
            dis = getDistance(position.coords, {
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
            });

            if (dis < 100) {
              distances = loc;
            }
          });
          if (Object.keys(distances).length > 0) {
            this.setState({
              locationId: distances.locId,

              locationName: distances.locationName,
              atTheAssignedLocation: true,
            });
          } else {
            this.setState({locationId: 0, atTheAssignedLocation: false});
          }
        },
        error => this.setState({error: error?.message}),
      );
    } catch (e) {
      console.log(e);
    }
  };

  hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await this.hasLocationPermissionIOS();
      return hasPermission;
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  _checkIn = async type => {
    console.log(this.state.userModule);
    this.setState({loading: true});
    var data = {};
    data['usersId'] = Number(this.state.userID);
    data['userName'] = this.state.userName;
    data['locationId'] = Number(this.state.locationId);
    data['locationName'] = this.state.locationName;
    data['type'] = type;
    data['createdBy'] = this.state.userName;

    var headers = Constants.HEADERS;
    headers['Authorization'] = 'Token ' + this.state.userToken;
    headers['module'] = this.state.userModule;
    headers['Content-Type'] = 'application/json';
    var obj = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };

    var url = Constants.SERVER_CALL + 'addDriverAttendanceCheckIn';
    console.log(url);
    console.log(obj);
    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log(obj);
        console.log(json);
        this.setState({loading: false});
        if (json != null) {
          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            ToastAndroid.show(json.message, ToastAndroid.SHORT);
            this._checkAttendance();
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
            // onPress: () =>
            //   this.props.navigation.push('AuthStackScreen', {
            //     screen: 'login',
            //   }),
          },
        ]);
      });
  };

  _validateLocation = async location => {
    try {
      const hasLocationPermission = await this.hasLocationPermission();
      if (!hasLocationPermission) {
        return;
      }
      var dis,
        distances = {},
        locId,
        locName;

      Geolocation.getCurrentPosition(
        position => {
          location.map(loc => {
            dis = getDistance(position.coords, {
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
            });
            this.setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

            if (dis < 100) {
              distances = loc;
            }
          });
          if (Object.keys(distances).length > 0) {
            locId = distances.locId;
            locName = distances.locationName;
          } else {
            locId = 0;
          }

          this.setState({
            locationId: locId,
            isLocationAssigned: true,
            locationName: locName,
          });

          if (locId == 0) {
            this.getLocationAddress();
          } else {
            this._checkOut('YES');
          }
        },
        error => this.setState({error: error?.message}),
      );
    } catch (e) {
      console.log(e);
    }
  };

  async getLocationAddress() {
    const {latitude, longitude} = this.state;
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=` +
      GOOGLE_KEY;

    console.log(url);
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      this.setState({address: data.results[0].formatted_address});
      this._checkOut('NO');
    }
  }

  _checkOut = async type => {
    this.setState({loading: true});
    var data = {};

    if (this.state.locationId > 0) {
      data['usersId'] = Number(this.state.userID);

      data['attdId'] = Number(this.state.attendanceId);
      data['locationName'] = this.state.locationName;
      data['locationId'] = Number(this.state.locationId);
      data['isAssignedLocation'] = 'YES';
    } else {
      data['usersId'] = Number(this.state.userID);

      data['attdId'] = Number(this.state.attendanceId);
      data['locationName'] = this.state.address;
      data['isAssignedLocation'] = 'NO';
      data['latitude'] = this.state.latitude;
      data['longitude'] = this.state.longitude;
    }

    var headers = Constants.HEADERS;
    headers['Authorization'] = 'Token ' + this.state.userToken;
    headers['module'] = this.state.userModule;
    headers['Content-Type'] = 'application/json';
    var obj = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };

    var url = Constants.SERVER_CALL + 'addDriverAttendanceCheckOut';
    console.log(url);
    console.log(obj);

    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log(obj);
        console.log(json);
        this.setState({loading: false});
        if (json != null) {
          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            if (type == 'CHECKED_OUT') {
              this.setState({
                CheckOutData: json,
                previousInTime: json.checkInTime,
                previousOutTime: json.checkOutTime,
              });
            }
            ToastAndroid.show(json.message, ToastAndroid.SHORT);
            this._checkAttendance();
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

  _gotoLogout = () => {
    var data = {};

    data['usersId'] = Number(this.state.userID);
    var headers = Constants.HEADERS;
    headers['Authorization'] = 'Token ' + this.state.userToken;
    headers['module'] = this.state.userModule;
    headers['Content-Type'] = 'application/json';
    var obj = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    var url = Constants.SERVER_CALL + 'logout';
    console.log(url);
    console.log(obj);

    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(json => {
        AsyncStorage.removeItem('USER');
        ToastAndroid.show(json.message, ToastAndroid.SHORT);
        this.props.navigation.push('AuthStackScreen', {screen: 'Login'});
      }).catch = e => {
      AsyncStorage.removeItem('USER');
      this.props.navigation.push('AuthStackScreen', {screen: 'Login'});

      console.log(e);
    };
  };

  _gotoLogoutAlert = () => {
    Alert.alert(
      'Alert',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => this._gotoLogout()},
      ],
      {cancelable: false},
    );
  };

  render() {
    const {assignedLocationData} = this.state;
    return (
      <SafeAreaView style={{flex: 1}}>
        <Appbar.Header>
          <Appbar.Content title=" DashBoard" titleStyle={styles.headerText} />
          <Appbar.Action
            icon="power-standby"
            onPress={() => this._gotoLogoutAlert()}
          />
        </Appbar.Header>

        {!this.state.loading ? (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={() => this.onRefresh()}
              />
            }
            style={{marginBottom: '5%'}}>
            <View style={styles.container}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: '8%',
                }}>
                <MIcon
                  name="hand-wave"
                  size={30}
                  color="#F1C40F"
                  style={{transform: [{rotateY: '180deg'}]}}
                />
                {/* <Image
                  style={{width: 30, height: 30}}
                  source={require('../../assets/waving-hand.png')}
                /> */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '500',
                    paddingLeft: 15,
                    color: '#000',
                  }}>
                  Hello, {this.state.userName}
                </Text>
              </View>

              {this.state.isLocationAssigned && (
                <View>
                  {this.state.atTheAssignedLocation &&
                  assignedLocationData.hasOwnProperty('logInStatus') &&
                  assignedLocationData.logInStatus != '' &&
                  assignedLocationData.logInStatus == 'PENDING' ? (
                    <View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          paddingTop: '15%',
                        }}>
                        <Image
                          style={{width: 100, height: 100}}
                          source={require('../../assets/radar.gif')}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: '400',
                            marginTop: 20,
                          }}>
                          You are at the destination
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {!this.state.atTheAssignedLocation &&
                  assignedLocationData.hasOwnProperty('logInStatus') &&
                  assignedLocationData.logInStatus != '' &&
                  assignedLocationData.logInStatus == 'PENDING' ? (
                    <View
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          width: width * 0.75,
                          paddingTop: '25%',
                        }}>
                        <Image
                          style={{width: 50, height: 50}}
                          source={require('../../assets/car.png')}
                        />
                      </View>

                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          paddingBottom: '10%',
                        }}>
                        <Image
                          style={{width: 150, height: 150}}
                          source={require('../../assets/measure-distance.png')}
                        />
                      </View>
                      <Text style={{fontSize: 14, padding: 10, color: 'red'}}>
                        You should be with in 100 meter's radius to mark
                        Attendence
                      </Text>
                      <TouchableOpacity
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 20,
                        }}
                        onPress={() => this.onRefresh()}>
                        <View
                          style={[
                            styles.btn,
                            {
                              width: width * 0.5,
                              backgroundColor: '#0ba6ff',
                            },
                          ]}>
                          <Text style={[styles.btn_text, {color: '#fff'}]}>
                            Refresh
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {assignedLocationData.hasOwnProperty('logInStatus') &&
                  assignedLocationData.logInStatus != '' &&
                  assignedLocationData.logInStatus == 'PENDING' &&
                  this.state.atTheAssignedLocation ? (
                    <View>
                      <TouchableOpacity
                        disabled={
                          assignedLocationData.logInStatus == 'CHECKED_IN' ||
                          assignedLocationData.logInStatus == 'CHECKED_OUT'
                        }
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 20,
                          elevation: 4,
                        }}
                        onPress={() => this._checkIn('CHECKED_IN')}>
                        <View
                          style={[
                            styles.btn,
                            {
                              width: width * 0.5,
                              backgroundColor:
                                assignedLocationData.logInStatus == 'PENDING'
                                  ? '#2ECC71'
                                  : '#ccc',
                            },
                          ]}>
                          <Text style={[styles.btn_text, {color: '#fff'}]}>
                            Check In
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {assignedLocationData.hasOwnProperty('logInStatus') &&
                  assignedLocationData.logInStatus != '' &&
                  assignedLocationData.logInStatus == 'CHECKED_IN' ? (
                    <View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          paddingTop: '10%',
                        }}>
                        <Image
                          style={{width: width / 1.8, height: 150}}
                          source={require('../../assets/car-driver.png')}
                        />
                      </View>
                      <TouchableOpacity
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 20,
                        }}
                        onPress={() =>
                          this._validateLocation(
                            this.state.assignedLocationData.locations,
                          )
                        }>
                        <View
                          style={[
                            styles.btn,
                            {
                              width: width * 0.5,
                              backgroundColor: '#E74C3C',
                            },
                          ]}>
                          <Text style={[styles.btn_text, {color: '#fff'}]}>
                            Check Out
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: width * 0.9,
                      marginTop: 15,
                      marginLeft: '2%',
                    }}>
                    {assignedLocationData.checkIn && (
                      <Surface
                        elevation={4}
                        category="medium"
                        style={{
                          width: 150,
                          height: 100,

                          padding: 20,
                        }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#aaa',
                            textAlign: 'center',
                          }}>
                          Check In
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            padding: 5,
                          }}>
                          <FoIcon name="date" color={'#000'} size={14} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(assignedLocationData.checkIn)
                              .utc()
                              .format('DD MMM YYYY')}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',

                            padding: 5,
                          }}>
                          <IIcon name="time-outline" color={'#000'} size={16} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(assignedLocationData.checkIn)
                              .utc()
                              .format('LT')}
                          </Text>
                        </View>
                      </Surface>
                    )}
                    {assignedLocationData.checkIn ? (
                      <Surface
                        elevation={4}
                        category="medium"
                        style={{
                          width: 150,
                          height: 100,
                          margin: '4%',
                          padding: 20,
                        }}>
                        <Text
                          style={{
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#aaa',
                          }}>
                          Check Out
                        </Text>
                        {assignedLocationData.checkOut ? (
                          <View
                            style={{
                              flexDirection: 'row',

                              padding: 5,
                            }}>
                            <FoIcon name="date" color={'#000'} size={14} />

                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#000',
                                paddingLeft: 10,
                              }}>
                              {moment(assignedLocationData.checkOut)
                                .utc()
                                .format('DD MMM YYYY')}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',

                              padding: 5,
                            }}>
                            <FoIcon name="date" color={'#000'} size={14} />

                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#000',
                                paddingLeft: 10,
                              }}>
                              --/--
                            </Text>
                          </View>
                        )}

                        {assignedLocationData.checkOut ? (
                          <View
                            style={{
                              flexDirection: 'row',

                              padding: 5,
                            }}>
                            <IIcon
                              name="time-outline"
                              color={'#000'}
                              size={16}
                            />

                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#000',
                                paddingLeft: 10,
                              }}>
                              {moment(new Date(assignedLocationData.checkOut))
                                .utc()
                                .format('LT')}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',

                              padding: 5,
                            }}>
                            <IIcon
                              name="time-outline"
                              color={'#000'}
                              size={16}
                            />

                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#000',
                                paddingLeft: 10,
                              }}>
                              --/--
                            </Text>
                          </View>
                        )}
                      </Surface>
                    ) : null}
                  </View>

                  {assignedLocationData.logInStatus == 'PENDING' &&
                  this.state.previousInTime != '' &&
                  this.state.previousInTime != null &&
                  this.state.previousOutTime != '' &&
                  this.state.previousOutTime != null ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: width * 0.9,
                        marginLeft: '2%',
                      }}>
                      <Surface
                        elevation={4}
                        category="medium"
                        style={{
                          width: 150,
                          height: 100,

                          padding: 20,
                        }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#aaa',
                            textAlign: 'center',
                          }}>
                          Check In
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',

                            padding: 5,
                          }}>
                          <FoIcon name="date" color={'#000'} size={14} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(new Date(this.state.previousInTime)).format(
                              'DD MMM YYYY',
                            )}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',

                            padding: 5,
                          }}>
                          <IIcon name="time-outline" color={'#000'} size={16} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(new Date(this.state.previousInTime))
                              .utc()
                              .format('LT')}
                          </Text>
                        </View>
                      </Surface>
                      <Surface
                        elevation={4}
                        category="medium"
                        style={{
                          width: 150,
                          height: 100,
                          margin: '4%',
                          padding: 20,
                        }}>
                        <Text
                          style={{
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#aaa',
                          }}>
                          Check Out
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',

                            padding: 5,
                          }}>
                          <FoIcon name="date" color={'#000'} size={14} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(
                              new Date(this.state.previousOutTime),
                            ).format('DD MMM YYYY')}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: 'row',

                            padding: 5,
                          }}>
                          <IIcon name="time-outline" color={'#000'} size={16} />

                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#000',
                              paddingLeft: 10,
                            }}>
                            {moment(new Date(this.state.previousOutTime))
                              .utc()
                              .format('LT')}
                          </Text>
                        </View>
                      </Surface>
                    </View>
                  ) : null}
                </View>
              )}
              {!this.state.isLocationAssigned && (
                <View
                  style={{
                    width: width * 0.9,
                    paddingTop: '20%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <AIcon name="exclamationcircle" size={80} color="#D30937" />
                  {/* <Image
                    style={{width: 80, height: 80}}
                    source={require('../../assets/error.png')}
                  /> */}
                  <Text style={{paddingTop: 20, color: '#000'}}>
                    You have not assigned to any location.
                  </Text>
                  <TouchableOpacity
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 20,
                    }}
                    onPress={() => this.onRefresh()}>
                    <View
                      style={[
                        styles.btn,
                        {
                          width: width * 0.5,
                          backgroundColor: '#0ba6ff',
                        },
                      ]}>
                      <Text style={[styles.btn_text, {color: '#fff'}]}>
                        Refresh
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  marginTop: 10,
                }}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      width: width * 0.44,
                      borderWidth: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      // height: 50,
                      elevation: 4,
                    },
                  ]}
                  onPress={() =>
                    this.props.navigation.push('AppStackScreen', {
                      screen: 'ApplyLeave',
                    })
                  }>
                  <Text
                    style={[styles.btn_text, {color: '#3CA6EC', fontSize: 14}]}>
                    Leaves
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      width: width * 0.44,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 0,
                      elevation: 4,
                    },
                  ]}
                  onPress={() =>
                    this.props.navigation.push('AuthStackScreen', {
                      screen: 'Password',
                      params: {comeFrom: 'DashBoard'},
                    })
                  }>
                  <Text
                    style={[styles.btn_text, {color: '#3CA6EC', fontSize: 14}]}>
                    Change Password ?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : null}
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
