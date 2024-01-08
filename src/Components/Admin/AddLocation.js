/* eslint-disable prettier/prettier */
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
  Modal,
} from 'react-native';
import styles from '../../styles';
import MIcon from 'react-native-vector-icons/MaterialIcons';
const {height, width} = Dimensions.get('window');
import Loader from '../../Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from '../../Constants';
import {TextInput} from '@react-native-material/core';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {FAB, Appbar} from 'react-native-paper';
import SearchInput, {createFilter} from 'react-native-search-filter';
import IIcon from 'react-native-vector-icons/Ionicons';
const KEYS_TO_FILTERS = ['locationName', 'address'];
import jwt_decode from 'jwt-decode';
import {apiCall} from '../../CommonServices';

export default class AddLocation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adminName: '',
      Token: '',
      loading: false,
      locationsData: [],
      modalVisible: false,
      selectedAddress: '',
      latitude: '',
      longitude: '',
      assignedLocationName: '',
      searchVisible: false,
      searchTerm: '',
      isValid: false,
      isLogin: false,
      refreshToken: '',
      tokenExpiresin: '',
      refreshTokenExpires: '',
      accessModule: '',
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
          this._locationsData();
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

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._locationsData();

      this.setState({refreshing: false});
    }, 2000);
  };

  searchUpdated(term) {
    this.setState({searchTerm: term});
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

  _locationsData = async () => {
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
        this.setState({locationsData: resp.data});
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

  _locationDelete = async locId => {
    this.setState({loading: true});

    try {
      const resp = await apiCall(
        'deleteLocation/' + locId,
        'DELETE',
        null,
        this.state.Token,
        this.state.accessModule,
      );

      var headers = Constants.HEADERS;
      headers['Authorization'] = 'Token ' + this.state.Token;
      headers['module'] = this.state.accessModule;
      headers['Content-Type'] = 'application/json';

      console.log(resp, '>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      if (resp != null && resp != '' && resp.status == 'success') {
        this.setState({loading: false});

        this._locationsData();
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

  _alertDriver = locId => {
    Alert.alert('Warning !', 'Are you sure want to delete this location ?', [
      {
        text: 'OK',
        onPress: () => this._locationDelete(locId),
      },
      {
        text: 'cancel',
        onPress: () => console.log('cancel pressed'),
      },
    ]);
  };

  _getAddressDetails = (data, details) => {
    console.log(data);
    var address = details.geometry.location;
    this.setState({
      latitude: address.lat,
      longitude: address.lng,
      selectedAddress: data.description,
    });
  };

  _addLocation = async () => {
    this.setState({loading: true});
    try {
      var data = {};
      data['createdBy'] = this.state.adminName;
      data['latitude'] = this.state.latitude;
      data['locationName'] = this.state.assignedLocationName.trim();
      data['longitude'] = this.state.longitude;
      data['address'] = this.state.selectedAddress;
      const resp = await apiCall(
        'addLocation',
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
        ToastAndroid.show(resp.message, ToastAndroid.SHORT);
        this._locationsData();
        this.setState({
          assignedLocationName: '',
          latitude: '',
          longitude: '',
          selectedAddress: '',
          searchTerm: '',
          modalVisible: !this.state.modalVisible,
        });
      } else {
        this.setState({loading: false});
        Alert.alert('Warning !', resp.message);
        this._locationsData();
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

  _cancelLocation = () => {
    this.setState({
      assignedLocationName: '',
      latitude: '',
      longitude: '',
      selectedAddress: '',
      modalVisible: !this.state.modalVisible,
    });
  };

  validateUsername = assignedLocationName => {
    const regex = /^[a-zA-Z,0-9 ]{3,100}$/;
    const isValid = regex.test(assignedLocationName);
    this.setState({assignedLocationName, isValid});
  };

  renderLocations = data => {
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
        <View style={{width: width * 0.9}}>
          <View style={{flexDirection: 'row'}}>
            <MIcon name="location-pin" color={'#000'} size={30} />
            <Text
              style={{
                ...styles.profileText,
                width: width * 0.75,
                paddingLeft: '1%',
                flexWrap: 'wrap',
              }}>
              {data.locationName}
            </Text>

            <TouchableOpacity
              style={{
                // width: width * 0.1,
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
              }}
              onPress={() => this._alertDriver(data.locId)}>
              <MIcon name="delete" color={'red'} size={25} />
            </TouchableOpacity>
          </View>

          <View style={{flexDirection: 'row', padding: 4}}>
            <Text style={{...styles.latlonText, color: '#000'}}>
              <Text style={{...styles.latlonText}}>Latitude :</Text>
              {data.latitude.toFixed(8)}
            </Text>
            <Text
              style={{...styles.latlonText, color: '#000', paddingLeft: 15}}>
              <Text style={{...styles.latlonText}}>Longitude :</Text>
              {data.longitude.toFixed(8)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: '#616A6B',
              paddingTop: 4,
              paddingLeft: 6,
            }}>
            <Text
              style={{
                fontSize: 14,
                color: '#000',
                fontWeight: '400',
              }}>
              address :
            </Text>
            {data.address}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    const {longitude, latitude} = this.state;
    const {modalVisible, searchVisible} = this.state;

    const locationsList = this.state.locationsData;
    const filteredLocations = locationsList.filter(
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
          <Appbar.Content title="Location" titleStyle={styles.headerText} />
          <Appbar.Action
            icon="layers-search-outline"
            color="#8E44AD"
            size={25}
            onPress={() =>
              this.setState({
                searchVisible: !searchVisible,
                modalVisible: false,
              })
            }
          />
        </Appbar.Header>

        {this.state.searchVisible ? (
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
                    searchVisible: !searchVisible,
                  })
                }
              />
            }
            clearButtonMode="while-editing"
            clearIconViewStyles={{position: 'absolute', top: 8, right: 10}}
            placeholder="Search Location name / address"
            placeholderTextColor={'#000'}
            style={{
              borderRadius: 10,
              height: 50,
              fontSize: 16,
              marginTop: 10,
              width: width * 0.95,
              alignSelf: 'center',
              backgroundColor: '#fff',
              elevation: 4,

              paddingLeft: 20,
            }}
          />
        ) : null}

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
              // margin: 20,
            }}>
            {this.state.modalVisible ? (
              <View
                style={{
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  elevation: 4,
                  borderRadius: 8,
                  padding: 10,
                  marginTop: '2%',
                }}>
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
                    Add Location
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
                  value={this.state.assignedLocationName}
                  onChangeText={this.validateUsername}
                  label="Enter name"
                  variant="outlined"
                  color="#808B96"
                  style={{
                    width: width * 0.9,
                    color: '#000',
                    fontSize: 16,
                    marginTop: 10,
                  }}
                />

                {!this.state.isValid &&
                  this.state.assignedLocationName != '' && (
                    <Text style={{color: 'red'}}>
                      Please enter a valid name.
                    </Text>
                  )}

                <View
                  style={{
                    borderWidth: 1,
                    borderRadius: 4,
                    borderColor: '#aaa',
                    width: width * 0.9,
                  }}>
                  <GooglePlacesAutocomplete
                    placeholder="Search location ... "
                    query={{
                      key: 'AIzaSyDsivkqbokA-Mtyl8Uq7bhFgxIaQcUUXtI',
                      language: 'en',
                      components: 'country:IN',
                    }}
                    fetchDetails={true}
                    onPress={(data, details = null) =>
                      this._getAddressDetails(data, details)
                    }
                    onFail={error => console.log(error)}
                    listViewDisplayed={true}
                    keepResultsAfterBlur={true}
                    styles={{
                      fontSize: 16,
                      borderColor: '#000',
                      borderWidth: 1,
                      color: '#000',
                    }}
                    onNotFound={() => console.log('no results')}
                    requestUrl={{
                      url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                      useOnPlatform: 'web',
                    }}
                  />
                </View>

                <View style={{flexDirection: 'row'}}>
                  <TextInput
                    value={latitude.toString()}
                    onChangeText={text => {
                      this.setState({latitude: text});
                    }}
                    label="Latitude"
                    variant="outlined"
                    color="#808B96"
                    keyboardType="numeric"
                    style={{
                      width: width * 0.45,
                      color: '#000',
                      fontSize: 16,
                      marginTop: 5,
                    }}
                  />
                  <TextInput
                    value={longitude.toString()}
                    onChangeText={text => {
                      this.setState({longitude: text});
                    }}
                    label="Longitude"
                    variant="outlined"
                    color="#808B96"
                    keyboardType="numeric"
                    style={{
                      width: width * 0.44,
                      color: '#000',
                      fontSize: 16,
                      marginTop: 5,
                      marginLeft: '1%',
                    }}
                  />
                </View>

                {this.state.latitude != '' &&
                this.state.latitude != null &&
                this.state.longitude != '' &&
                this.state.longitude != null &&
                this.state.assignedLocationName != '' &&
                this.state.assignedLocationName != null &&
                this.state.isValid ? (
                  <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                      onPress={() => this._addLocation()}>
                      <View
                        style={[
                          styles.btn,
                          {
                            width: width * 0.45,
                            backgroundColor: '#8E44AD',
                            padding: 10,
                          },
                        ]}>
                        <Text style={[styles.btn_text, {color: '#fff'}]}>
                          Submit
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                      onPress={() => this._cancelLocation()}>
                      <View
                        style={[
                          styles.btn,
                          {
                            width: width * 0.45,
                            backgroundColor: '#F5B041',
                            padding: 10,
                            marginLeft: '1%',
                          },
                        ]}>
                        <Text style={[styles.btn_text, {color: '#fff'}]}>
                          Cancel
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={{marginBottom: '1%'}}>
              {this.state.locationsData.length > 0 &&
              filteredLocations.length > 0 ? (
                <FlatList
                  data={filteredLocations}
                  renderItem={this.renderLocations}
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
                modalVisible: !this.state.modalVisible,
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
