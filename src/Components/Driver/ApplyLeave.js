/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import {
  View,
  Text,
  BackHandler,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Image,
  ToastAndroid,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import styles from '../../styles';
import Constants from '../../Constants';
const {width} = Dimensions.get('window');
import EnIcon from 'react-native-vector-icons/Entypo';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import Loader from '../../Loader';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import EIcon from 'react-native-vector-icons/EvilIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView} from 'react-native-gesture-handler';
import {FAB, Appbar} from 'react-native-paper';

export default class ApplyLeave extends Component {
  constructor(props) {
    super(props);
    var defaultDate = this._defaultDate();
    this.state = {
      userToken: '',
      userID: '',
      visibleCalendar: false,
      visibleCalendar1: false,
      loading: false,
      Date: defaultDate,
      Date1: defaultDate,
      Leaves: [],
      Reason: '',
      appliedDate: '',
      todayDate: defaultDate,
      modalVisible: false,
      revealed: false,
      selectedIndex: 0,
      isLeavesEmpty: false,
      driverName: '',
      refreshing: false,
      userModule: '',
    };

    try {
      AsyncStorage.getItem('USER')
        .then(value => {
          if (value != '' && value != null) {
            var user = JSON.parse(value);
            console.log(user.data.module);
            console.log('..............................................');

            this.setState({
              userToken: user.Token,
              userID: user.data.usersId,
              userName: user.data.name,
              userModule: user.data.module,
            });

            this._getLeaves('APPROVED');
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
    this.props.navigation.navigate('AppStackScreen', {screen: 'DashBoard'});
    return true;
  }
  _defaultDate(type) {
    var d = new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var time =
      (d.getHours() < 10 ? '0' + d.getHours() : d.getHours()) +
      ':' +
      (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());

    var output =
      d.getFullYear() +
      '-' +
      (('' + month).length < 2 ? '0' : '') +
      month +
      '-' +
      (('' + day).length < 2 ? '0' : '') +
      day;

    if (type == 'DATETIME') {
      var output = output + ' ' + time;
    }
    return output;
  }

  _getLeaves = type => {
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
      Constants.SERVER_CALL +
      'userLeavesGet?usersId=' +
      this.state.userID +
      '&leavesStatus=' +
      type;
    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        // console.log(json);
        this.setState({loading: false});

        if (
          json != '' &&
          json != null &&
          json.status == 'success' &&
          json.hasOwnProperty('data') &&
          json.data.length > 0
        ) {
          let date = new Date();
          this.setState({
            Leaves: json.data,
            isLeavesEmpty: false,
          });
          json.data.map(item => {
            date = item.date;
          });
          this.setState({
            appliedDate: date,
          });
        } else if (json.status == 'error') {
          Alert.alert('Warning !', json.message);
        } else {
          this.setState({isLeavesEmpty: true});
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

  onRefresh = () => {
    this.setState({refreshing: true});
    setTimeout(() => {
      this._getLeaves('APPROVED');

      this.setState({refreshing: false, selectedIndex: 0});
    }, 2000);
  };

  setDate = (event, value) => {
    var dateSelected = moment(value).format('YYYY-MM-DD');
    this.setState({
      visibleCalendar: !this.state.visibleCalendar,
    });
    if (this.state.Leaves.length > 0) {
      this.state.Leaves.map(item => {
        if (dateSelected == item.date) {
          Alert.alert(
            'Warning!',
            'You are already applied leave on selected date',
          );
          dateSelected = this._defaultDate();
        }
        this.setState({Date: dateSelected, Date1: dateSelected});
      });
    } else {
      this.setState({Date: dateSelected, Date1: dateSelected});
    }
  };

  setDate1 = (event, value) => {
    var dateSelected = moment(value).format('YYYY-MM-DD');
    this.setState({
      visibleCalendar1: !this.state.visibleCalendar1,
    });
    if (this.state.Leaves.length > 0) {
      this.state.Leaves.map(item => {
        if (dateSelected == item.date) {
          Alert.alert(
            'Warning!',
            'You have already applied leave on selected date',
          );
          dateSelected = this._defaultDate();
        }
        this.setState({Date1: dateSelected});
      });
    } else {
      this.setState({Date1: dateSelected});
    }
  };

  _applyLeave = () => {
    console.log(this.state.userModule);
    console.log('this.state.userModule');

    var data = {};
    data['usersId'] = Number(this.state.userID);
    data['fromDate'] = this.state.Date;
    data['toDate'] = moment(this.state.Date1).format('YYYY-MM-DD');
    data['leavesReason'] = this.state.Reason;
    data['userName'] = this.state.userName;

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
    var url = Constants.SERVER_CALL + 'applyLeave';
    console.log(url);
    console.log(obj);
    fetch(url, obj)
      .then(res => {
        return res.json();
      })
      .then(async json => {
        console.log('++++++++++++');
        console.log(json);
        if (json != null) {
          if (
            json.status != null &&
            json.status != '' &&
            json.status == 'success'
          ) {
            ToastAndroid.show('Leave applied successfully', ToastAndroid.SHORT);

            this.setState({
              modalVisible: !this.state.modalVisible,
              Date: this._defaultDate(),
              Date1: this._defaultDate(),
              Reason: '',
              selectedIndex: 1,
            });

            this._getLeaves('PENDING');
          } else if (json.status == 'error') {
            Alert.alert('Alert !', json.message);
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

  renderLeaves(data) {
    var data = data.item;
    return (
      <View
        style={{
          width: width * 0.9,
          marginLeft: '5%',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#ccc',
        }}>
        <View
          style={{
            marginTop: 10,
            borderColor: '#ccc',
            padding: 10,
            borderRadius: 8,
          }}>
          <View style={{width: width * 0.7, flexDirection: 'row'}}>
            <View style={{width: width * 0.2}}>
              <Text style={{textAlign: 'right'}}>From : </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#000',
                }}>
                {moment(data.fromDate).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>

          <View style={{width: width * 0.7, flexDirection: 'row'}}>
            <View style={{width: width * 0.2}}>
              <Text style={{textAlign: 'right'}}>To : </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#000',
                }}>
                {moment(data.toDate).utc().format('DD MMM YYYY')}
              </Text>
            </View>
          </View>

          <View style={{width: width * 0.7, flexDirection: 'row'}}>
            <View style={{width: width * 0.2}}>
              <Text style={{textAlign: 'right'}}>Reason : </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#000',
                }}>
                {data.leavesReason}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            width: width * 0.2,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 20,
          }}>
          {data.leavesStatus == 'APPROVED' ? (
            <Image
              style={{width: 50, height: 50}}
              source={require('../../assets/approved.png')}
            />
          ) : null}

          {data.leavesStatus == 'REJECTED' ? (
            <View>
              <Image
                style={{width: 50, height: 50}}
                source={require('../../assets/rejected.png')}
              />
            </View>
          ) : null}

          {data.leavesStatus == 'PENDING' ? (
            <View>
              <Image
                style={{width: 35, height: 35}}
                source={require('../../assets/sand-clock.png')}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  handleIndexChange = index => {
    console.log(index);
    this.setState({
      ...this.state,
      selectedIndex: index,
    });
    if (index == 0) this._getLeaves('APPROVED');
    else if (index == 1) this._getLeaves('PENDING');
    else this._getLeaves('REJECTED');
  };
  render() {
    const {modalVisible} = this.state;

    return (
      <SafeAreaView style={{flex: 1}}>
        <Appbar.Header>
          <Appbar.BackAction
            onPress={() =>
              this.props.navigation.push('AppStackScreen', {
                screen: 'DashBoard',
              })
            }
            color="#8E44AD"
          />
          <Appbar.Content title="Leaves" titleStyle={styles.headerText} />
        </Appbar.Header>

        <ScrollView
          style={{marginBottom: '5%'}}
          keyboardShouldPersistTaps={'handled'}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.onRefresh()}
            />
          }>
          <View style={styles.container}>
            <View
              style={{
                marginTop: 10,
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 20,
              }}>
              {this.state.visibleCalendar ? (
                <RNDateTimePicker
                  mode="date"
                  minimumDate={
                    new Date(moment().subtract(7, 'days').format('YYYY-MM-DD'))
                  }
                  value={new Date(this.state.Date)}
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
                  minimumDate={
                    new Date(moment(this.state.Date).format('YYYY-MM-DD'))
                  }
                  value={new Date(this.state.Date1)}
                  positiveButton={{label: 'OK', textColor: 'green'}}
                  negativeButton={{label: 'Cancel', textColor: 'red'}}
                  onChange={this.setDate1}
                />
              ) : null}
            </View>
          </View>

          <View
            style={{
              // top: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <SegmentedControlTab
              tabsContainerStyle={{
                width: '90%',
                alignSelf: 'center',

                borderRadius: 20,
              }}
              tabStyle={{borderColor: '#aaa', borderWidth: 0.9}}
              tabTextStyle={{fontSize: 14, color: '#000'}}
              activeTabStyle={{
                backgroundColor: '#D2B4DE',
              }}
              activeTabTextStyle={{color: '#000', fontWeight: '500'}}
              allowFontScaling={false}
              firstTabStyle={{
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
              }}
              lastTabStyle={{
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
              }}
              values={['APPROVED', 'PENDING', 'REJECTED']}
              selectedIndex={this.state.selectedIndex}
              onTabPress={this.handleIndexChange}
            />
          </View>
          <View style={{marginTop: 10}}>
            {this.state.isLeavesEmpty ? (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '10%',
                }}>
                <Image
                  source={require('../../assets/empty-leaves.png')}
                  style={{width: width * 0.6, height: 250}}
                />
                <Text style={{paddingTop: 10, fontSize: 14}}>No Leaves</Text>
              </View>
            ) : (
              <FlatList
                data={this.state.Leaves}
                renderItem={this.renderLeaves}
                keyExtractor={(item, index) => index.toString()}
              />
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          style={{
            alignSelf: 'flex-end',
            margin: 10,
            justifyContent: 'flex-end',
          }}
          onRequestClose={() => {
            this.setState({modalVisible: !modalVisible, Reason: ''});
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                }}
                onPress={() =>
                  this.setState({
                    modalVisible: !this.state.modalVisible,
                    Reason: '',
                  })
                }>
                <EnIcon name="cross" color={'#000'} size={35} />
              </TouchableOpacity>

              <View style={{flexDirection: 'row', paddingTop: 25}}>
                <View>
                  <Text style={{paddingLeft: 5}}>
                    From <Text style={{color: 'red'}}>*</Text>
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#ccc',
                    }}>
                    <View
                      style={[
                        {
                          width: width * 0.39,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}>
                      <TextInput
                        value={this.state.Date}
                        editable={false}
                        placeholder="Select Date"
                        style={{width: width * 0.3, color: '#000'}}
                      />
                      <EIcon
                        name="calendar"
                        color={'#000'}
                        size={30}
                        onPress={() => this.setState({visibleCalendar: true})}
                      />
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={{paddingLeft: 5}}>
                    To<Text style={{color: 'red'}}>*</Text>
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#ccc',
                      marginLeft: '1%',
                    }}>
                    <View
                      style={[
                        {
                          width: width * 0.39,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}>
                      <TextInput
                        value={this.state.Date1}
                        editable={false}
                        placeholder="Select Date"
                        style={{width: width * 0.3, color: '#000'}}
                      />
                      <EIcon
                        name="calendar"
                        color={'#000'}
                        size={30}
                        onPress={() => this.setState({visibleCalendar1: true})}
                      />
                    </View>
                  </View>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  marginTop: 8,
                  marginBottom: 10,
                }}>
                <TextInput
                  placeholder="Enter Reason"
                  onChangeText={text => {
                    this.setState({Reason: text});
                  }}
                  style={{width: width * 0.8, color: '#000'}}
                />
              </View>
              {this.state.Date != this.state.appliedDate &&
              this.state.Date != '' &&
              this.state.Reason != '' &&
              this.state.Reason != null ? (
                <TouchableOpacity
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 8,
                    marginBottom: 10,
                  }}
                  onPress={() => this._applyLeave()}>
                  <View
                    style={[
                      styles.btn,
                      {
                        width: width * 0.8,
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
          </View>
        </Modal>

        <View
          style={{
            alignItems: 'flex-end',
          }}>
          <FAB
            icon="plus"
            label="Apply Leaves"
            style={{position: 'absolute', right: 20, bottom: 20}}
            onPress={() => this.setState({modalVisible: !modalVisible})}
          />
        </View>
        <Loader loading={this.state.loading} />
      </SafeAreaView>
    );
  }
}
