import React, { Component } from "react";
import {
  Platform,
  View,
  ScrollView,
  Text,
  StatusBar,
  SafeAreaView,
  Image,
  TouchableOpacity
} from "react-native";
import { Container, Button, Icon } from "native-base";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { sliderWidth, itemWidth } from "../styles/SliderEntry.style";
import SliderEntry from "../components/SliderEntry";
import styles, { colors } from "../styles/index.style";
import { ENTRIES1, ENTRIES2 } from "../static/entries";
import { scrollInterpolators, animatedStyles } from "../utils/animations";
// utils
import Colors from "../utils/Colors";
import GLOBAL_PARAMS from "../utils/global_params";
import ToastUtil from '../utils/ToastUtil';
//api
import api from "../api";
//components
import CommonHeader from "../components/CommonHeader";
import ErrorPage from "../components/ErrorPage";
import Loading from '../components/Loading';

const IS_ANDROID = Platform.OS === "android";
const SLIDER_1_FIRST_ITEM = 1;

export default class ShopSwiperablePage extends Component {
    _current_offset = 0
  constructor(props) {
    super(props);
    this.state = {
      slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
      shopDetail: null,
      isError: false,
      loading: false
    };
  }

  componentWillReceiveProps() {
    console.log(this.props);
  }

  componentDidMount = () => {
    this._current_offset = 0;
    this.getRecommendList();
  };
  //api
  getRecommendList = () => {
    api.recommendOnlineShop(15,this._current_offset).then(
      data => {
        //   console.log(data);
        if (data.status === 200 && data.data.ro.ok) {
            if(data.data.data.length === 0) {
                ToastUtil.showWithMessage('沒有更多數據了...');
                this.setState({
                    loading: false
                })
                return ;
            }
          this.setState({
            shopDetail: data.data.data,
            loading:false
          });
        }
      },
      () => {
        if(this._current_offset > 0) {
            this._current_offset -= 15;
        }
        this.setState({ isError: true,loading: false });
      }
    );
  };
  
  _refresh = () => {
    this._current_offset += 15;
    this.setState({
        loading: true
    });
    this.getRecommendList();
  }

  _renderItem({ item, index }) {
    return (
      <SliderEntry
        data={item}
        even={(index + 1) % 2 === 0}
        {...this["props"]}
      />
    );
  }

  _renderItemWithParallax({ item, index }, parallaxProps) {
    return (
      <SliderEntry
        data={item}
        even={(index + 1) % 2 === 0}
        parallax={true}
        parallaxProps={parallaxProps}
      />
    );
  }

  _renderLightItem({ item, index }) {
    return <SliderEntry data={item} even={false} {...this["props"]} />;
  }

  _renderDarkItem({ item, index }) {
    return <SliderEntry data={item} even={true} {...this["props"]} />;
  }

  mainExample(number, title) {
    const { slider1ActiveSlide } = this.state;

    return this.state.shopDetail !== null ? (
      <View style={[styles.exampleContainer, { marginTop: -15 }]}>
        {/*<Text style={[styles.title,{color:'#1a1917'}]}>商家列表</Text>*/}
        <Text style={[styles.subtitle, { color: "#1a1917" }]}>{title}</Text>
        <Carousel
          ref={c => (this._slider1Ref = c)}
          data={this.state.shopDetail}
          renderItem={this._renderItemWithParallax}
          sliderWidth={sliderWidth}
          itemWidth={itemWidth}
          hasParallaxImages={true}
          firstItem={SLIDER_1_FIRST_ITEM}
          inactiveSlideScale={0.94}
          inactiveSlideOpacity={0.7}
          // inactiveSlideShift={20}
          containerCustomStyle={styles.slider}
          contentContainerCustomStyle={styles.sliderContentContainer}
          loop={true}
          loopClonesPerSide={2}
          autoplay={true}
          autoplayDelay={500}
          autoplayInterval={3000}
          onSnapToItem={index => this.setState({ slider1ActiveSlide: index })}
        />
      </View>
    ) : null;
  }

  render() {
    const example1 = this.mainExample(1, "- 為您推薦 -");

    return (
      <Container>
        <CommonHeader title="線上推薦" {...this["props"]} />
        {this.state.isError ? (
          <ErrorPage errorToDo={this._getRecommendList} />
        ) : null}
        {this.state.loading ? <Loading/> : null}
        <ScrollView
          style={styles.scrollview}
          scrollEventThrottle={200}
          directionalLockEnabled={true}
        >
          {example1}
          {/*<View style={{height:GLOBAL_PARAMS._winHeight*0.15,flexDirection:'row',backgroundColor:this.props.screenProps.theme}}>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'dislike'}}/>
                          </TouchableOpacity>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'like'}}/>
                          </TouchableOpacity>
                        </View>*/}
          <Button
            transparent
            style={{ alignSelf: "center", flexDirection: "row" }}
            onPress={() => this._refresh()}
          >
            <Icon
              name="md-refresh"
              style={{ fontSize: 40, color: this.props.screenProps.theme }}
            />
            <Text style={{ fontSize: 20, color: this.props.screenProps.theme }}>
              換一批
            </Text>
          </Button>
        </ScrollView>
      </Container>
    );
  }
}