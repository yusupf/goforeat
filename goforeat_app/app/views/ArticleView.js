import React, {Component} from 'react'
import {View,TouchableWithoutFeedback, SectionList,StyleSheet,RefreshControl} from 'react-native'
import {
  Container,
  Card,
  CardItem,
} from 'native-base';
import Image from 'react-native-image-progress';
//utils
import ToastUtil from '../utils/ToastUtil';
import Colors from '../utils/Colors';
import GLOBAL_PARAMS from '../utils/global_params';
//api
import api from '../api';
import source from '../api/CancelToken';
//components
import ErrorPage from '../components/ErrorPage';
import CommonHeader from '../components/CommonHeader';
import ListFooter from '../components/ListFooter';
import Loading from '../components/Loading';
import Text from '../components/UnScalingText';
//language
import I18n from '../language/i18n';

let requestParams = {
  status: {
    LOADING: 0,
    LOAD_SUCCESS: 1,
    LOAD_FAILED: 2,
    NO_MORE_DATA: 3
  },
  nextOffset: 0,
  currentOffset: 0
}

export default class ArticleView extends Component {
  static navigationOptions = ({screenProps}) => ({
    tabBarLabel: I18n[screenProps.language].weekMenu
  });
  state = {
    articleList: null,
    loadingStatus:{
      firstPageLoading: GLOBAL_PARAMS.httpStatus.LOADING,
      pullUpLoading: GLOBAL_PARAMS.httpStatus.LOADING,
    },
    refreshing: false,
    i18n: I18n[this.props.screenProps.language]
  }

  componentDidMount() {
    this._onRequestFirstPageData()
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      i18n: I18n[nextProps.screenProps.language]
    })
  }

  componentWillUnmount() {
    source.cancel()
  }
  
  //common functions

  _onRequestFirstPageData = () => {
    api.getArticleList(0).then(data => {
      this.setState({
        refreshing: false
      })
      if(data.status === 200) {
        data.data.data = data.data.data.map((v,i) => ({
          ...v,
          date_title: v.title.split(' ')[0],
          food_title: v.title.split(' ')[1]
        }))

        this.setState({
          articleList: data.data.data,
          loadingStatus:{
            firstPageLoading: GLOBAL_PARAMS.httpStatus.LOAD_SUCCESS
          }
        })
      }
      else{
        this.setState({
          articleList: data.data.data,
          refreshing: false,
          loadingStatus:{
            firstPageLoading: GLOBAL_PARAMS.httpStatus.LOAD_FAILED
          }
        })
      }
    },() => {
      ToastUtil.showWithMessage(this.state.i18n.common_tips.network_err);
      this.setState({
        loadingStatus:{
          firstPageLoading:GLOBAL_PARAMS.httpStatus.LOAD_FAILED
        }
      })
    })
  }

  _onErrorRequestFirstPage = () => {
    this.setState({
      loadingStatus: {
        firstPageLoading: GLOBAL_PARAMS.httpStatus.LOADING
      }
    })
    this._onRequestFirstPageData()
  }

  _onRequestNextPage = (offset) => {
    api.getArticleList(offset).then(data => {
      if (data.status === 200 && data.data.ro.ok) {
        if(data.data.data.length === 0){
          requestParams.nextOffset = requestParams.currentOffset
          this.setState({
            articleList: this.state.articleList.concat(data.data.data),
            loadingStatus: {
              pullUpLoading:GLOBAL_PARAMS.httpStatus.NO_MORE_DATA
            }
          })
          return
        }
        data.data.data = data.data.data.map((v,i) => ({
          ...v,
          date_title: v.title.split(' ')[0],
          food_title: v.title.split(' ')[1]
        }))

        this.setState({
          articleList: this.state.articleList.concat(data.data.data),
          loadingStatus: {
            pullUpLoading:GLOBAL_PARAMS.httpStatus.LOADING
          }
        })
        requestParams.currentOffset = requestParams.nextOffset
      }else{
        ToastUtil.showWithMessage(this.state.i18n.article_tips.fail.load)
        requestParams.nextOffset = requestParams.currentOffset
        this.setState({
          loadingStatus: {
            pullUpLoading: GLOBAL_PARAMS.httpStatus.LOAD_FAILED
          }
        })
      }
    },() => {
      requestParams.nextOffset = requestParams.currentOffset
      this.setState({
        loadingStatus: {
          pullUpLoading: GLOBAL_PARAMS.httpStatus.LOAD_FAILED
        }
      })
    })
  }

  _onRefreshToRequestFirstPageData() {
    this.setState({
      refreshing: true
    });
    requestParams.currentOffset = 1;
    this._onRequestFirstPageData();
  }

  _onEndReach = () => {
    requestParams.nextOffset += 5
    this._onRequestNextPage(requestParams.nextOffset)
  }

  _onErrorToRequestNextPage() {
    this.setState({
      loadingStatus:{
        pullUpLoading:GLOBAL_PARAMS.httpStatus.LOADING
      }
    })
    requestParams.nextOffset += 5
    this._onRequestNextPage(requestParams.nextOffset)
  }

  _renderArticleListView = () => (
    <SectionList
      sections={[
        {title:'餐廳列表',data:this.state.articleList},
      ]}
      renderItem = {({item,index}) => this._renderArticleListItemView(item,index)}
      // renderSectionHeader= {() => (<View style={{height:20}}></View>)}
      keyExtractor={(item, index) => index}
      onEndReachedThreshold={0.01}
      onEndReached={() => this._onEndReach()}
      // ListHeaderComponent={() => <ArticleSwiper />}
      ListFooterComponent={() => (<ListFooter loadingStatus={this.state.loadingStatus.pullUpLoading} errorToDo={() => this._onErrorToRequestNextPage()} {...this.props}/>)}
      refreshControl={
        <RefreshControl
          refreshing={this.state.refreshing}
          onRefresh={() => this._onRefreshToRequestFirstPageData()}
        />
      }
    />
  )

  _renderArticleListItemView = (item,index) => (
      <TouchableWithoutFeedback style={styles.articleItemContainer}
        onPress={() => this.props.navigation.navigate('Content', {data: item,kind:'article'})}>
        <Card style={{width: GLOBAL_PARAMS._winWidth*0.95,alignSelf: 'center',}}>
          <CardItem cardBody>
            <Image source={{uri: item.pic}} style={{height: GLOBAL_PARAMS.heightAuto(250), width: null, flex: 1,borderBottomWidth: 1,borderBottomColor: Colors.main_gray}} resizeMode="cover"/>
          </CardItem>
          <CardItem>
              <View style={styles.articleDesc}>
              <Text style={[styles.articleTitle,{fontSize: 20,color:this.props.screenProps.theme}]}>{item.date_title}</Text>
              <Text style={[styles.articleTitle,{marginTop:3,fontSize: 15,}]}>{item.food_title}</Text>
          </View>
            </CardItem>
        </Card>
      </TouchableWithoutFeedback>
    )

  render() {
    let {i18n} = this.state;
    return (<Container style={{position:'relative'}}>
    <CommonHeader title={i18n.weekMenu} {...this.props}/>
    {this.state.loadingStatus.firstPageLoading === GLOBAL_PARAMS.httpStatus.LOADING ?
      <Loading/> : (this.state.loadingStatus.firstPageLoading === GLOBAL_PARAMS.httpStatus.LOAD_FAILED ?
        <ErrorPage errorTips={i18n.common_tips.network_err} errorToDo={this._onErrorRequestFirstPage} {...this.props}/> : null)}
      <View style={{marginBottom:GLOBAL_PARAMS.bottomDistance}}>
        {
            this.state.articleList !== null
            ? this._renderArticleListView()
            : null
        }
      </View>    
    </Container>)
    }
  }

const styles = StyleSheet.create({
  articleItemContainer:{
    height:250,
    flex:1,
    borderRadius: 20,
    margin: 10,
    borderRadius :5
  },
  artivleItemInnerContainer: {
    flex:1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
  },
  articleImage: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  articleDesc: {
    flex:1,
    justifyContent:'center',
    alignItems: 'flex-start',
    paddingLeft:10,
    backgroundColor: '#fff',
    paddingTop:3,
    paddingBottom:3
  },
  articleTitle: {
    fontSize:18,
    marginBottom:5,
    textAlign:'center'
  },
  articleSubTitle: {
    fontSize:14,
    color:'#959595'
  }
})
