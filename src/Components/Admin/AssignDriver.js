import React, {Component} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  FlatList,
  ToastAndroid,
  RefreshControl,
  BackHandler,
} from 'react-native';
import styles from '../../styles';
import MIcon from 'react-native-vector-icons/MaterialIcons';
const {height, width} = Dimensions.get('window');
import Loader from '../../Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from '../../Constants';
import {FAB} from 'react-native-paper';
import {Picker} from '@react-native-picker/picker';
import {Chip, Appbar} from 'react-native-paper';
var assigningSameLocation = false;
import jwt_decode from 'jwt-decode';
import {apiCall} from '../../CommonServices';

export default class AssignDriver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adminName: '',
      Token: '',
      loading: false,
      driversData: [],
      unAssignedDriverslist: '',
      unassignedlist: [],
      unassignedLocations: [],
      unAssignedLocationslist: '',
      assignLat: '',
      assignLon: '',
      assignLocationName: '',
      assignLocId: '',
      assignDriverId: '',
      assignDrivername: '',
      locations: [],
      selectedLocations: [],
      modalVisible: false,
      assignedDriverLocations: [],
      locationsData: [],
      refreshing: false,
      disableSubmit: false,
      refreshToken: '',
      tokenExpiresin: '',
      refreshTokenExpires: '',
      accessModule: '',
      isLogin: false,
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

            this.setState(
              {
                adminName: decoded.given_name,
                Token: accessToken,
                refreshToken: admin.refresh_token,
                tokenExpiresin: decoded.exp,
                refreshTokenExpires: admin.refresh_expires_in,
              },
              () => this._driversData(),
              this._getDrivers(),
              this._getLocations(),
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
    this.props.navigation.navigate('AppStackScreen', {screen: 'Home'});
    return true;
  }

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

  _driversData = async () => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'getUserLocation?usersId=' + this.state.assignDriverId,
        'GET',
        null,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      console.log(resp, '>>>>>>>>>>>>>>>>>>>>driversData>>>>>>>>>>>>>>>>');

      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({loading: false});
        this.setState({driversData: resp.data});
      } else {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Warning !', 'Something went wrong please try later.', [
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

  _getDrivers = async () => {
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

      // console.log(resp, '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({loading: false});
        this.setState({unassignedlist: resp.data});
      } else {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Warning !', 'Something went wrong please try later.', [
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

  _getLocations = async () => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'getLocation',
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
        this.setState({loading: false});
        this.setState({unassignedLocations: resp.data});
      } else {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Warning !', 'Something went wrong please try later.', [
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

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._driversData();

      this.setState({refreshing: false});
    }, 2000);
  };

  _unassign = unassignedlist => {
    console.log(unassignedlist);
    console.log('unassignedlist....................................');

    this.setState(
      {
        unAssignedDriverslist: unassignedlist,
        assignDriverId: unassignedlist.usersId,
        assignDrivername: unassignedlist.name,
      },
      () => this._driversData(),
    );
  };

  _locations = async unassignedLocations => {
    var locations = [];
    this.state.driversData.map(loc => {
      if (loc.hasOwnProperty('locations')) locations = loc.locations;
    });

    let isAssigned = false;
    this.setState({disableSubmit: false});
    if (locations.length > 0) {
      locations.map(loc => {
        if (loc.locId == unassignedLocations.locId) {
          isAssigned = true;

          Alert.alert(
            'Warning',
            'Location already assigned,Please choose another location',
          );
        }
      });
    }
    if (!isAssigned) {
      this.setState({disableSubmit: true});
      this._setLocation(unassignedLocations);
    } else {
      this.setState({disableSubmit: false});
    }
  };

  _setLocation = unassignedLocations => {
    this.setState({
      unAssignedLocationslist: unassignedLocations,
      assignLat: unassignedLocations.latitude,
      assignLon: unassignedLocations.longitude,
      assignLocationName: unassignedLocations.locationName,
      assignLocId: unassignedLocations.locId,
    });
  };

  _assignDriver = async () => {
    this.setState({loading: true});

    var locationData = {
      latitude: Number(this.state.assignLat),
      longitude: Number(this.state.assignLon),
      locationName: this.state.assignLocationName,
      locId: Number(this.state.assignLocId),
    };

    var locationsAssigned = [];

    this.state.driversData.map(item => {
      if (item.usersId == this.state.assignDriverId) {
        locationsAssigned = item.locations;
      }
    });

    locationsAssigned.push(locationData);

    try {
      var data = {};
      data['createdBy'] = this.state.adminName;
      data['userName'] = this.state.assignDrivername;
      data['usersId'] = Number(this.state.assignDriverId);
      data['locations'] = locationsAssigned;
      const resp = await apiCall(
        'setUserLocation',
        'POST',
        data,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      // console.log(resp, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({loading: false});
        ToastAndroid.show(resp.message, ToastAndroid.SHORT);

        this.setState({
          unAssignedLocationslist: '',
          unAssignedDriverslist: '',
          modalVisible: !this.state.modalVisible,
          assignedDriverLocations: [],
          assignDriverId: '',
        });
        this._driversData();
      } else {
        Alert.alert('Warning !', resp.message);
      }
    } catch (e) {
      console.log(e);
      console.log('ERROR');
      this.setState({loading: false});

      Alert.alert('Warning !', 'Something went wrong please try later.', [
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

  _deleteLocation = async (dlId, locId) => {
    this.setState({loading: true});
    try {
      const resp = await apiCall(
        'deleteUserLocation/' + dlId + '/' + locId,
        'DELETE',
        null,
        this.state.Token,
        this.state.accessModule,
      );
      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      // console.log(resp, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

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

      Alert.alert('Warning !', 'Something went wrong please try later.', [
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

  _alertDriver = dlId => {
    Alert.alert('Warning !', 'Are you sure want to delete this driver ?', [
      {
        text: 'OK',
        onPress: () => this._driverDelete(dlId),
      },
      {
        text: 'cancel',
        onPress: () => console.log('cancel pressed'),
      },
    ]);
  };

  renderDriver = data => {
    var data = data.item;

    return (
      <View
        style={{
          marginTop: 5,
          backgroundColor: '#fff',
          elevation: 4,
          borderRadius: 8,
          margin: 2,
          padding: 8,
        }}>
        <View style={{padding: 4}}>
          <View style={{width: width * 0.8}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <MIcon name="account-circle" color={'#000'} size={30} />
              <Text style={{...styles.profileText, elevation: 4}}>
                {data.userName}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 4,
                flexWrap: 'wrap',
              }}>
              {data.locations.map(item => {
                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      padding: 4,
                    }}>
                    <Chip
                      icon="map-marker"
                      onClose={() =>
                        this._deleteLocation(data.dlId, item.locId)
                      }>
                      {' '}
                      {item.locationName}
                    </Chip>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };
  onSelectedItemsChange = selectedLocations => {
    this.setState({selectedLocations});
  };

  render() {
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
            <Appbar.Content
              title="Assign User"
              titleStyle={styles.headerText}
            />
          ) : (
            <Appbar.Content
              title=" Assign Driver"
              titleStyle={styles.headerText}
            />
          )}
        </Appbar.Header>
        <ScrollView
          keyboardShouldPersistTaps={'handled'}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.onRefresh()}
            />
          }
          style={{marginBottom: '5%'}}>
          <View
            style={{
              width: width * 0.96,
              justifyContent: 'center',
              alignSelf: 'center',
            }}>
            {this.state.modalVisible ? (
              <View
                style={{
                  marginBottom: 4,
                  backgroundColor: '#fff',

                  alignSelf: 'center',
                  padding: 10,
                  elevation: 4,
                  borderRadius: 8,
                  marginTop: 6,
                }}>
                <Text style={styles.dropdownText}>Unassigned drivers</Text>

                <View style={{...styles.dropdownView, width: width * 0.9}}>
                  <Picker
                    mode="dropdown"
                    placeholder="--Select--"
                    selectedValue={this.state.unAssignedDriverslist}
                    onValueChange={itemValue => this._unassign(itemValue)}>
                    <Picker.Item label="Select Driver" value="0" />
                    {this.state.unassignedlist.map(item => {
                      return <Picker.Item label={item.name} value={item} />;
                    })}
                  </Picker>
                </View>
                <Text style={styles.dropdownText}>Locations</Text>

                <View
                  style={{
                    ...styles.dropdownView,
                    marginTop: 4,
                    width: width * 0.9,
                  }}>
                  <Picker
                    mode="dropdown"
                    placeholder="--Select--"
                    selectedValue={this.state.unAssignedLocationslist}
                    onValueChange={item => this._locations(item)}>
                    <Picker.Item label="Select Location" value="0" />
                    {this.state.unassignedLocations.map(item => {
                      return (
                        <Picker.Item label={item.locationName} value={item} />
                      );
                    })}
                  </Picker>
                </View>
                {this.state.disableSubmit === true ? (
                  <TouchableOpacity
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                    onPress={() => this._assignDriver()}>
                    <View
                      style={[
                        styles.btn,
                        {
                          width: width * 0.9,
                          backgroundColor: '#8E44AD',
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
            ) : null}

            <View style={{marginBottom: '1%'}}>
              {this.state.driversData.length > 0 ? (
                <FlatList
                  data={this.state.driversData}
                  renderItem={this.renderDriver}
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
            this.setState({modalVisible: !this.state.modalVisible})
          }
        />

        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
