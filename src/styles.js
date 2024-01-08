/* eslint-disable prettier/prettier */
import { Dimensions } from 'react-native';
const { height, width } = Dimensions.get('window');
export default {
  //Admin
  profileText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'left',
    paddingLeft: 10,
    fontWeight: '600',
  },
  leavesBtn: {
    width: width * 0.43,
    justifyContent: 'center',
    backgroundColor: '#F2D7D5',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  dropdownView: {
    backgroundColor: '#F4ECF7',
    // elevation: 4,
    borderRadius: 4,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616A6B',
    padding: 4,
    textAlign: 'left',
  },
  statusFlag: {
    fontSize: 15,
    color: '#000',
    textAlign: 'left',
    // color: 'green',
    paddingHorizontal: 30,
    fontWeight: '600',
  },
  dltBtn: {
    backgroundColor: '#FADBD8',
    padding: 6,
    borderRadius: 30,
    elevation: 4,
  },
  latlonText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
    // color: '#616A6B',
  },
  counts: {
    width: width * 0.45,
    backgroundColor: '#fff',
    //padding: 10,
    elevation: 4,
    borderRadius: 8,
    height: 100,
    justifyContent: 'center',
  },
  fromtoDateView: {
    width: width * 0.45,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2874A6',
  },

  fromTodateText: { fontSize: 14, fontWeight: '500', color: '#21618C' },
  countsText: { textAlign: 'center', fontSize: 18, fontWeight: '700' },
  knowmoreText: { textAlign: 'center', fontSize: 12, color: '#000' },
  modalView1: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  radioBtnview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Driver
  container: {
    width: width * 0.9,
    alignSelf: 'center',
  },
  text: {
    fontSize: 20,
  },
  btn: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
  },
  btn_text: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  HeaderView: {
    width: width * 0.9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  HeaderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E44AD',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  headers: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  headers1: { fontSize: 14, fontWeight: '400', color: '#000', paddingTop: 10 },

  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: width * 0.98,
    alignSelf: 'center',

    //marginTop: 22,
  },

  notificationView: {
    paddingHorizontal: 6,
    flexDirection: 'row',
    top: 10,
    left: 4,
    width: width * 0.92,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    paddingVertical: 4,
    marginLeft: 12,
    alignItems: 'center',
  },

  modalView: {
    // marginBottom: 20,
    width: width,
    alignSelf: 'center',
    backgroundColor: '#fff',
    // borderRadius: 20,
    // padding: 10,
    alignItems: 'center',

    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  headerText: {
    fontSize: 20,
    color: '#8E44AD',
    fontWeight: '600',
  },
};
