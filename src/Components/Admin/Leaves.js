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
} from 'react-native';
import styles from '../../styles';
import MIcon from 'react-native-vector-icons/MaterialIcons';
const {height, width} = Dimensions.get('window');
import Loader from '../../Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from '../../Constants';
import moment from 'moment';
import {Appbar} from 'react-native-paper';
import jwt_decode from 'jwt-decode';
import {apiCall} from '../../CommonServices';

export default class Leaves extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adminName: '',
      Token: '',
      loading: false,
      leavesData: [],
      driverID: '',
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
          console.log('value');

          console.log(value);
          console.log('value');

          if (value != '' && value != null) {
            var admin = JSON.parse(value);

            var accessToken = admin.access_token;
            var decoded = jwt_decode(accessToken);
            console.log(admin.refresh_token);
            console.log('accessToken.....................');

            this.setState({
              adminName: decoded.given_name,
              Token: accessToken,
              refreshToken: admin.refresh_token,
              tokenExpiresin: decoded.exp,
              refreshTokenExpires: admin.refresh_expires_in,
            });
          }
          this._leavesData();
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
  _leavesData = async () => {
    this.setState({loading: true});
    try {
      const resp = await apiCall(
        'getAdminApplyLeave?leavesStatus=' + 'PENDING',
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
        this.setState({leavesData: resp.data});
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

  _leavesApproval = async (usersId, ulId, leavesStatus) => {
    this.setState({loading: true});
    try {
      var data = {};
      data['usersId'] = usersId;
      data['leavesStatus'] = leavesStatus;
      data['ulId'] = ulId;

      const resp = await apiCall(
        'updateLeaveStatus',
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
        if (this.state.leavesData.length > 1) {
          this._leavesData();
        } else if (this.state.leavesData.length == 1) {
          this.props.navigation.push('AppStackScreen', {screen: 'Home'});
        }

        ToastAndroid.show(resp.message, ToastAndroid.SHORT);
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

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._leavesData();

      this.setState({refreshing: false});
    }, 2000);
  };

  renderLeaves = data => {
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
        <View style={{padding: 8}}>
          <View style={{width: width * 0.8}}>
            <View style={{flexDirection: 'row'}}>
              <View
                style={{
                  width: width * 0.8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <MIcon name="account-circle" color={'#000'} size={30} />
                <Text style={{...styles.profileText, elevation: 4}}>
                  {data.userName}
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', paddingTop: 8}}>
              <View style={{width: width * 0.45}}>
                <Text style={{...styles.latlonText, color: '#000'}}>
                  <Text style={{...styles.latlonText}}>
                    {''} From : {''}
                  </Text>
                  {''}
                  {moment(data.fromDate).format('DD MMM YYYY')}{' '}
                </Text>
              </View>

              <Text style={{...styles.latlonText, color: '#000'}}>
                <Text style={{...styles.latlonText}}>
                  {''} To : {''}
                </Text>
                {''}
                {moment(data.toDate).utc().format('DD MMM YYYY')}{' '}
              </Text>
            </View>

            <View style={{width: width * 0.9, paddingTop: 5}}>
              <Text style={{...styles.latlonText, color: '#000'}}>
                <Text style={{...styles.latlonText}}>
                  {''} Reason : {''}
                </Text>
                {''}
                {data.leavesReason}
              </Text>
            </View>

            <View style={{flexDirection: 'row', marginTop: '5%'}}>
              <TouchableOpacity
                style={{...styles.leavesBtn, backgroundColor: '#D5F5E3'}}
                onPress={() =>
                  this._leavesApproval(data.usersId, data.ulId, 'APPROVED')
                }>
                <Text
                  style={{
                    ...styles.latlonText,
                    color: '#28B463',
                    textAlign: 'center',
                    fontSize: 18,
                  }}>
                  Accept
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{...styles.leavesBtn, marginLeft: '2%'}}
                onPress={() =>
                  this._leavesApproval(data.usersId, data.ulId, 'REJECTED')
                }>
                <Text
                  style={{
                    ...styles.latlonText,
                    color: '#E74C3C',
                    textAlign: 'center',
                    fontSize: 18,
                  }}>
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
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
          <Appbar.Content title="Leaves" titleStyle={styles.headerText} />
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
            <View style={{marginBottom: '1%'}}>
              {this.state.leavesData.length > 0 ? (
                <FlatList
                  data={this.state.leavesData}
                  renderItem={this.renderLeaves}
                  keyExtractor={(item, index) => index.toString()}
                />
              ) : (
                <View
                  style={{
                    justifyContent: 'center',
                    alignSelf: 'center',
                    paddingVertical: 60,
                  }}>
                  <Text style={{fontSize: 20, color: '#909497'}}>
                    No pending leaves
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
