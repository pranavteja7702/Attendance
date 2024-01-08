import React from 'react';
import {StyleSheet, View, Modal, Image, ActivityIndicator} from 'react-native';

const Loader = props => {
  const {loading} = props;

  return (
    <Modal
      transparent={true}
      animationType={'none'}
      visible={loading}
      onRequestClose={() => {
        console.log('close modal');
      }}>
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <Image
            source={require('./assets/loader.gif')}
            resizeMode="contain"
            style={{height: 100, width: 100}}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  activityIndicatorWrapper: {
    height: 100,
    width: 100,
    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loader;
