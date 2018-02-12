import {LOGIN,LOGOUT,STOCK_ARTICLE,STOCK_SHOP,DELETE_ARTICLE,DELETE_SHOP} from '../actions'
//cache
import appStorage from '../cache/appStorage'
//utils
import ToastUtil from '../utils/ToastUtil'
import Colors from '../utils/Colors'

const initialState = {
  userState:{
    username:null
  },
  goodsListState: {
    refreshParams:null //註冊后返回首頁強刷
  },
  favoriteStock:{
    articleList:{title:'文章收藏',data:[]},
    shopList:{title:'商店收藏',data:[]}
  },
  themeState: {
    theme: Colors.main_orange
  }
}

export function auth(state=initialState.userState,action) {
  switch(action.type) {
    case LOGIN:
    appStorage.setLoginUserJsonData(action.username)
    return {
      ...state,
      username: action.username
    };
    case LOGOUT:
    return {
      ...state,
      username: null
    }
    default:return state
  }
}

export function stockShop(state=initialState.favoriteStock.shopList,action) {
  switch(action.type) {
    case STOCK_SHOP: {
      let _data = state.data.concat(action.data)
      return {
        ...state,
        data: _data
      }
    }
    case DELETE_SHOP: {
      return {
        ...state,
        data: state.data.filter(item => item.id !== action.id)
      }
    }
    default:return state
  }
}

export function refresh(state = initialState.goodsListState,action) {
  switch(action.type) {
    case 'REFRESH': return {
      ...state,
      refreshParams:action.refresh
    }
    default: return state
  }
}

export function theme(state = initialState.themeState,action) {
  switch(action.type) {
    case 'CHANGE_THEME':
      console.log('reducers',action.theme)
      appStorage.setTheme(action.theme)
      return {
        ...state,
        theme: action.theme
      }
    default: return state
  }
}

export function http(){

}
