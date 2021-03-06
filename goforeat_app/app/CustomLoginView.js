import React, { PureComponent } from 'react';
import {
  Image,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard
} from "react-native";
import {
  Input,
  Icon,
  ActionSheet
} from "native-base";
//utils
import GLOBAL_PARAMS from "./utils/global_params";
import ToastUtil from "./utils/ToastUtil";
//cache
import appStorage from './cache/appStorage';
//api
import api from './api/index';
import source from './api/CancelToken';
//language
import i18n from './language/i18n';
//jpush
import JPushModule from 'jpush-react-native';
//styles 
import LoginStyle from './styles/login.style';
import CommonStyle from './styles/common.style';
//components
import CommonBottomBtn from './components/CommonBottomBtn';
import Text from './components/UnScalingText';
import I18n from './language/i18n';

const BUTTONS = [
  GLOBAL_PARAMS.phoneType.HK.label,
  GLOBAL_PARAMS.phoneType.CHN.label
];
const DESTRUCTIVE_INDEX = 3;
const CANCEL_INDEX = 4;

export default class CustomLoginView extends PureComponent {
  _textInput = null;
  token = 'null';
  _timer = null;
  _keyboard_height = 0;
  state = {
    phone: null,
    password: null,
    selectedValue:GLOBAL_PARAMS.phoneType.HK,
    codeContent: I18n[this.props.screenProps.language].sendCode,
    isCodeDisabled: false,
    isKeyBoardShow: false,
    containerTop: new Animated.Value(0),
    keyboardHeight: null,
    i18n: I18n[this.props.screenProps.language]
  };

  componentWillMount () {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => this._keyboardDidShow(e));
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => this._keyboardDidHide());
  }

  componentWillUnmount() {
    source.cancel();
    clearInterval(this.interval);
    clearTimeout(this._timer);
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  //common function

  _keyboardDidShow (e) {
    // this._keyboard_height = e.startCoordinates.height - e.endCoordinates.height;
    this._toggleKeyBoard(1);
  }

  _keyboardDidHide () {
    this._toggleKeyBoard(0);
  }

  _sendPhoneAndGetCode() {
    if (this.state.phone === null) {
      ToastUtil.showWithMessage("手機號格式有誤");
      return;
    }
    api.getCode(this.state.phone, this.state.selectedValue.value).then(
      data => {
        if (data.status === 200 && data.data.ro.ok) {
          this.token = data.data.data.token;
          ToastUtil.showWithMessage("驗證碼發送成功");
          let _during = 60;
          this.interval = setInterval(() => {
            _during--;
            this.setState({
              codeContent: `${_during}秒后重發`,
              isCodeDisabled: true
            });
            if (_during === 0) {
              this.setState({
                codeContent: '重新發送',
                isCodeDisabled: false
              });
              clearInterval(this.interval);
            }
          }, 1000);
        } else {
          ToastUtil.showWithMessage(data.data.ro.respMsg);
        }
      },
      () => {
        ToastUtil.showWithMessage("驗證碼發送失敗");
      }
    );
  };

  _getPhone(phone) {
    this.setState({
      phone: phone
    })
  }

  _getPassword(text) {
    this.setState({
      password: text
    });
  }

  _login() {
    let {params} = this.props.navigation.state;
    let {phone,selectedValue,password} = this.state;
    if(this.state.phone === null){
      ToastUtil.showWithMessage("請填寫手機號")
      return
    }
    if(this.state.password === null){
      ToastUtil.showWithMessage("請填寫驗證碼")
      return
    }
    api.checkCode(phone,selectedValue.value,this.token,password).then(data => {
      if(data.status === 200 && data.data.ro.ok){
        ToastUtil.showWithMessage("登錄成功")
        appStorage.setLoginUserJsonData(this.state.phone,data.data.data.sid);
        this.props.screenProps.userLogin(this.state.phone,data.data.data.sid);
        if(typeof params === 'undefined') {
          this.props.navigation.goBack()
        }else {
          if(params.page == 'Order') {
            this.props.navigation.navigate('Order',
              {
                  replaceRoute: true,
                  foodId: params.foodId,
                  placeId: params.placeId,
                  amount: params.amount,
                  total: params.total
              })
          }else {
            this.props.navigation.navigate(params.page,{replaceRoute: true,});
          }
        }
        JPushModule.getRegistrationID(registrationId => {
          api.saveDevices(registrationId,data.data.data.sid).then(sdata => {
          });
        },() => {
          ToastUtil.showWithMessage("登錄失敗")
        })
      }
      else{
        ToastUtil.showWithMessage(data.data.ro.respMsg);
      }
    })
    .catch(err => {
      ToastUtil.showWithMessage('發生未知錯誤');
    })
  }

  _showActionSheet = () => {
    ActionSheet.show(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        title: "選擇電話類型"
      },
      buttonIndex => {
        switch (BUTTONS[buttonIndex]) {
          case GLOBAL_PARAMS.phoneType.HK.label:
            this.setState({ selectedValue: GLOBAL_PARAMS.phoneType.HK });
            break;
          case GLOBAL_PARAMS.phoneType.CHN.label:
            this.setState({ selectedValue: GLOBAL_PARAMS.phoneType.CHN });
            break;
        }
      }
    );
  };

  _toggleKeyBoard(val) {
      Animated.timing(this.state.containerTop, {
        toValue: val,
        duration: 200,
        easing: Easing.linear
      }).start();
  }

  //render function

  _renderTopImage() {
    let {navigation} = this.props;
    return (
      <View style={LoginStyle.TopImageView}>
        <Image source={require('./asset/login_bg.png')}
        style={LoginStyle.TopImage} reasizeMode="cover"/>
        <View style={LoginStyle.TopImageViewInner}>
          <Image source={require('./asset/logoTop.png')} style={LoginStyle.TopImageViewTitle}/>
        </View>
        <TouchableOpacity style={LoginStyle.CloseBtn} 
        onPress={() => {navigation.goBack();
          if(navigation.state.params) {
            if(navigation.state.params.page == 'Order') {
              navigation.state.params.reloadFunc();
            }
          }
        }}>
          <Icon
            name="ios-arrow-back"
            style={LoginStyle.CloseImage}
          />
        </TouchableOpacity>
      </View>
    )
  }

  _renderContentView() {
    let {i18n} = this.state;
    return (
      <View style={LoginStyle.ContentView}>
        <Text style={LoginStyle.Title}>{i18n.signInPhone}</Text>
        <View style={LoginStyle.CommonView}>
          <View style={LoginStyle.CommonInputView}>
            <Image source={require('./asset/phone.png')} style={LoginStyle.Icon} reasizeMode="cover"/>
            <TouchableOpacity onPress={() => this._showActionSheet()} style={LoginStyle.ChangePhoneTypeBtn}>
              <Text style={LoginStyle.PhoneTypeText}>{this.state.selectedValue.label}</Text>
              <Image reasizeMode="cover" source={require('./asset/arrowdown.png')} style={LoginStyle.ArrowDown}/>
            </TouchableOpacity>
            <Input 
              ref={(t) => this._textInput = t}
              allowFontScaling={false}
              onChangeText={phone => this._getPhone(phone)}
              style={LoginStyle.CommonInput}
              multiline={false}
              autoFocus={false}
              placeholder={i18n.fillInPhone}
              keyboardType="numeric"
              clearButtonMode="while-editing"
              placeholderTextColor="#999999"
              maxLength={11}
              returnKeyType="done"/>
          </View>
          <View style={LoginStyle.CommonInputView}>
            <Image source={require('./asset/password.png')} style={LoginStyle.Icon} reasizeMode="cover"/>
            <Input 
            onChangeText={password => this._getPassword(password)}
            style={LoginStyle.CommonInput} 
            allowFontScaling={false}
            multiline={false}
            autoFocus={false}
            placeholder={i18n.fillInCode}
            clearButtonMode="while-editing"
            placeholderTextColor="#999999"
            returnKeyType="done"
            keyboardType="numeric"
            maxLength={6}/>
            <TouchableOpacity style={[LoginStyle.SendBtn,{borderColor: this.state.isCodeDisabled?"#ff4141":"#999999"}]} disabled={this.state.isCodeDisabled} onPress={() => this._sendPhoneAndGetCode()}>
              <Text style={[LoginStyle.SendText,{color: this.state.isCodeDisabled?"#ff4141":"#999999"}]}>{this.state.codeContent}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CommonBottomBtn clickFunc={() => this._login()}>{i18n.loginOrRegister}</CommonBottomBtn>
      </View>
    )
  }

  _renderDividerView() {
    return (
      <View style={CommonStyle.DividerView}>
        <View style={CommonStyle.Divider}/>
        <Text style={CommonStyle.DividerText}>或</Text>
        <View style={CommonStyle.Divider}/>
      </View>
    )
  }

  _renderBottomView() {
    return (
      <View style={CommonStyle.BottomView}>
        {this._renderDividerView()}
        <View style={CommonStyle.BottomViewInner}>
          <Image source={require('./asset/facebook2.png')} style={CommonStyle.BottomViewInnerImage} />
          <Image source={require('./asset/wechat.png')} style={CommonStyle.BottomViewInnerImage} />
        </View>
      </View>
    )
  }

  render() {
    return (
      <Animated.View style={[LoginStyle.LoginContainer,{transform: [{translateY: this.state.containerTop.interpolate({
        inputRange: [0,1],
        outputRange: [0,-GLOBAL_PARAMS._winHeight*0.25]
      })}]}]}>
        {this._renderTopImage()}
        {this._renderContentView()}
        {/*this._renderBottomView()*/}
      </Animated.View>
    )
  }

}
