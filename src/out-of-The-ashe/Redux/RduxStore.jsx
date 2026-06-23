import { configureStore ,combineReducers} from "@reduxjs/toolkit";
import authReducer from "./auth"
import WebState from './StateWeb'
import { persistStore,persistReducer,FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER} from "redux-persist";
import storage from 'redux-persist/lib/storage';

import { APi } from "./CenteralAPI";



const rootReducer=combineReducers({
'auth':authReducer,
'webState':WebState,
   [APi.reducerPath]:APi.reducer
    
})
const persisConfig= {key:'root',storage: storage.default ? storage.default : storage,whitelist:['auth']};
const presisReducer=persistReducer(persisConfig,rootReducer)

export const store=configureStore({
  
  reducer:presisReducer,
 
  
  
  middleware:(getDefaultMiddleware)=>{
 
   return getDefaultMiddleware({serializableCheck:false,
    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
   }).concat(APi.middleware);

  }
})
export const persistor=persistStore(store);