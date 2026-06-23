import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.jsx'

import { store ,persistor} from './out-of-The-ashe/Redux/RduxStore.jsx'
import { Provider } from 'react-redux'
import HomePage from './out-of-The-ashe/page/HomePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    < Provider store={store} >
    <PersistGate loading={null} persistor={persistor}>
    <div >
<App></App>
   </div>
   </PersistGate>
   </Provider>
  </StrictMode>

)
