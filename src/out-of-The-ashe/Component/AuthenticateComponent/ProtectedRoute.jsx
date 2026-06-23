import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useGetPermissionsOwnQuery } from "../../Redux/Employee";


const ProtectedRoute = ({ children, roles = [], permission = null }) => {
  const { isAuthenticate, role } = useSelector((state) => state.auth);
  const location = useLocation();
  const {data:newperm}=useGetPermissionsOwnQuery()
  const [permissions,Setnewperm]=useState({})


useEffect(()=>{
 
Setnewperm(newperm?.data)
},[newperm])
  // 1. Not logged in → go to login
  if (!isAuthenticate) {
    return <Navigate to="/loginpage" state={{ from: location }} replace />;
  }

  const isAdmin = role === "Admin";

  

  // 3. Permission check (if permission string provided)
  if (permission) {
    const hasPermission = isAdmin || permissions?.[permission] === true;
    if (!hasPermission) {
      return <Navigate to="/DashboardPage" replace />;
    }
  }else{
    <Navigate to="/DashboardPage" replace />
  }

  return children;
};

export default ProtectedRoute;