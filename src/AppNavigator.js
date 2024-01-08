/* eslint-disable prettier/prettier */
import React, {Component} from 'react';
import {Easing} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';

//Login
import Login from './Components/Authentication/Login';

// Admin
import Home from './Components/Admin/Home';
import Drivers from './Components/Admin/Drivers';
import AddLocation from './Components/Admin/AddLocation';
import AssignDriver from './Components/Admin/AssignDriver';
import Leaves from './Components/Admin/Leaves';
import LeaveNotifications from '../src/Components/Admin/LeaveNotifications';

// Driver
import DashBoard from './Components/Driver/DashBoard';
import ApplyLeave from './Components/Driver/ApplyLeave';
import Password from './Components/Driver/Password';
import RqPassword from './Components/Driver/RqPassword';

//utils
import Loading from './Loading';
import Modules from './Components/Admin/Modules';

const MainStack = createStackNavigator();
const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const config = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const closeConfig = {
  animation: 'timing',
  config: {
    duration: 500,
    easing: Easing.linear,
  },
};

const MainStackScreen = () => (
  <MainStack.Navigator
    initialRouteName="Loading"
    screenOptions={{headerShown: false}}>
    <MainStack.Screen name="Loading" component={Loading} />
    <MainStack.Screen name="AuthStackScreen" component={AuthStackScreen} />
    <MainStack.Screen name="AppStackScreen" component={AppStackScreen} />
  </MainStack.Navigator>
);

const AuthStackScreen = () => (
  <AuthStack.Navigator
    // headerMode="none"
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      transitionSpec: {
        open: config,
        close: closeConfig,
      },
    }}>
    <AuthStack.Screen name="Login" component={Login} />

    <AuthStack.Screen name="Password" component={Password} options={{}} />
  </AuthStack.Navigator>
);

const AppStackScreen = () => (
  <AppStack.Navigator
    // headerMode="none"
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      transitionSpec: {
        open: config,
        close: closeConfig,
      },
    }}>
    <AppStack.Screen
      name="DashBoard"
      component={DashBoard}
      options={{headerShown: false}}
    />

    <AppStack.Screen
      name="ApplyLeave"
      component={ApplyLeave}
      options={{headerShown: false}}
    />

    <AppStack.Screen
      name="RqPassword"
      component={RqPassword}
      options={{headerShown: false}}
    />

    <AppStack.Screen
      name="Home"
      component={Home}
      options={{headerShown: false}}
    />
    <AppStack.Screen
      name="Drivers"
      component={Drivers}
      options={{headerShown: false}}
    />
    <AppStack.Screen
      name="AddLocation"
      component={AddLocation}
      options={{headerShown: false}}
    />
    <AppStack.Screen
      name="AssignDriver"
      component={AssignDriver}
      options={{headerShown: false}}
    />
    <AppStack.Screen
      name="Leaves"
      component={Leaves}
      options={{headerShown: false}}
    />

    <AppStack.Screen
      name="LeaveNotifications"
      component={LeaveNotifications}
      options={{headerShown: false}}
    />

    <AppStack.Screen
      name="Modules"
      component={Modules}
      options={{headerShown: false}}
    />
  </AppStack.Navigator>
);

class AppNavigator extends Component {
  render() {
    return (
      <NavigationContainer>
        <MainStackScreen />
      </NavigationContainer>
    );
  }
}

export default AppNavigator;
