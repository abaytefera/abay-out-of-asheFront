import React, { useEffect } from 'react'
// BrowserRouterን በ HashRouter ቀይረነዋል
import { HashRouter as Router, Routes, Route } from 'react-router-dom' 
import HomePage from './out-of-The-ashe/page/HomePage'
import LoginPage from './out-of-The-ashe/page/LoginPage'
import DashbordPage from './out-of-The-ashe/page/DashbordPage'
import ChildRegisterPage from './out-of-The-ashe/page/ChildRegisterPage'
import EmployeeRegisterPage from './out-of-The-ashe/page/EmployeeRegisterPage'
import SponsorPage from './out-of-The-ashe/page/SponsorsPage'
import ProfilePage from './out-of-The-ashe/page/ProfilePage'
import SponsorSingle from './out-of-The-ashe/Component/AuthenticateComponent/sponsor/SponsorSingle'
import SponsorList from './out-of-The-ashe/Component/AuthenticateComponent/sponsor/SponsorList'
import NotificationsPage from './out-of-The-ashe/page/NotificationsPage'
import PasswordChangePage from './out-of-The-ashe/page/PasswordChangePage'
import ChildSinglePage from './out-of-The-ashe/page/ChildSinglePage'
import AuditLogPage from './out-of-The-ashe/page/AuditLogPage'
import EmployeeSinglePage from './out-of-The-ashe/page/EmployeeSinglePage'
import { useSelector, useDispatch } from 'react-redux'
import { updateOnlineUser } from './out-of-The-ashe/Redux/StateWeb'
import RegisterChildPage from './out-of-The-ashe/page/RegisterChildPage'
import StudentManagement from './out-of-The-ashe/page/StudentManagement'
import ProtectedRoute from './out-of-The-ashe/Component/AuthenticateComponent/ProtectedRoute'
import EmployeesPage from './out-of-The-ashe/page/Employee/EmployeesPage'
import VulnerabilityAssessmentTab from './out-of-The-ashe/Component/AuthenticateComponent/child/tabs/VulnerabilityAssessmentTab'
import FinancialReport from './out-of-The-ashe/page/FinancialReport'
import SafeguardingView from './out-of-The-ashe/page/SafeguardingView'
import ManageSchools from './out-of-The-ashe/page/ManageSchools'
import AnalyticsDashboard from './out-of-The-ashe/Component/AuthenticateComponent/DashboardComponent/AnalyticsDashboard'
const App = () => {
  const { id } = useSelector((state) => state.auth)
  const Dispatch = useDispatch()

 

  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/loginpage' element={ <LoginPage />} />
        <Route path='/DashboardPage' element={<ProtectedRoute> <DashbordPage /></ProtectedRoute>} />
        <Route path='/EmployeerRgister' element={<EmployeeRegisterPage />} />
        <Route path='/ChildRegister' element={ <RegisterChildPage />} />
        <Route path='/ProfilePage' element={ <ProtectedRoute> <ProfilePage /> </ProtectedRoute>} />
      
        <Route path='/PasswordChange' element={<ProtectedRoute> <PasswordChangePage /> </ProtectedRoute>} />
        <Route path='/ChildSingle/:id' element={<ProtectedRoute> < ChildSinglePage /> </ProtectedRoute>} />
        <Route path='/EmployeeSingle/:id' element={ <ProtectedRoute><EmployeeSinglePage /> </ProtectedRoute>} />
        <Route path='/ALLChild' element={<ProtectedRoute> <StudentManagement /> </ProtectedRoute>} />
        <Route path='/ALLSponsor' element={ <SponsorPage /> } />
        <Route path='/sponsors/:id' element={ <SponsorSingle /> } />
        <Route path='/ALLEmployees' element={ <EmployeesPage /> } />
       <Route path="/Notifications" element={<NotificationsPage />} />
        <Route path="/audit-logs" element={<AuditLogPage/>} />
        <Route path="/financial" element={<FinancialReport />} />
        <Route path="/safeguarding/:id" element={<SafeguardingView />} />
        <Route path="/ManageSchools" element={< ManageSchools />} />
        <Route path="/AnalyticsDashboard" element={<AnalyticsDashboard />} />
  
      {/* <Route path='/Sponsor' element={<SponsorsPage ></SponsorsPage>}></Route> */}
        
       
      </Routes>
    </Router>
  )
}

export default App