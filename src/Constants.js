/* eslint-disable prettier/prettier */
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default {
  // SERVER_CALL: 'http://10.91.97.40:5013/api/', //local server
  // SERVER_CALL: 'https://fleet-attendance.intellaire.com/api/', //production server
  SERVER_CALL: 'https://qa-fleet-attendance.intellaire.com/api/', // test server

  HEADERS: {
    Accept: 'application/json',
    // 'Content-type': 'application/json',
    // 'Content-Type': 'application/json',
    deviceId: DeviceInfo.getDeviceId(),
    'api-version': 'V3',
  },
  LOGIN_HEADERS: {
    Accept: 'application/json',
    'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    deviceId: DeviceInfo.getDeviceId(),
    'api-version': 'V3',
  },
};
