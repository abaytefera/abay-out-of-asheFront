import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import DashboardBody from '../Component/AuthenticateComponent/DashboardComponent/DashbordBody';
import { useGetUserQuery } from '../Redux/User';
import { useGetChildsQuery, useGetChildDashboardQuery,useGetTrendStatsQuery  } from '../Redux/Childes';
import { useGetEmployeesQuery } from '../Redux/Employee';
import {
  useGetSafeguardingCasesQuery,
  useGetEducationAlertsQuery,
  useGetAuditLogsQuery,
  useGetWorkflowItemsQuery,
  useGetFinancialReportQuery,
  useGetNutritionAlertsQuery,
} from '../Redux/Dashboard';


const Spinner = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-12 h-12 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
    <p className="text-primBtn font-bold animate-pulse">Loading Workspace...</p>
  </div>
);

const DashboardPage = () => {
  const { id, isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
    window.scrollTo(0, 0);
  }, [isAuthenticate, navigate]);

  // ── Core data ────────────────────────────────────────────────────────────
  const { data: user,       isLoading: userLoad  } = useGetUserQuery(id, { skip: !id });
  const { data: childStats, isLoading: childLoad } = useGetChildDashboardQuery(undefined);
  const { data: children,   isLoading: listLoad  } = useGetChildsQuery({ limit: '5' });
  const { data: employees,  isLoading: empLoad   } = useGetEmployeesQuery(undefined);
  const { data: trendData, isLoading: trendLoad } = useGetTrendStatsQuery(undefined)

  // ── Module data ───────────────────────────────────────────────────────────
  const { data: safeguarding,   isLoading: sgLoad   } = useGetSafeguardingCasesQuery({ status: 'OPEN', limit: '5' });
  const { data: eduAlerts,      isLoading: eduLoad  } = useGetEducationAlertsQuery({ isResolved: 'false', limit: '8' });
  const { data: auditLogs,      isLoading: auditLoad} = useGetAuditLogsQuery({ limit: '8' });
  const { data: workflows,      isLoading: wfLoad   } = useGetWorkflowItemsQuery({ status: 'PENDING' });
  const { data: financialReport,isLoading: finLoad  } = useGetFinancialReportQuery({ limit: '5' });
  const { data: nutritionAlerts,isLoading: nutLoad  } = useGetNutritionAlertsQuery(undefined);

useEffect(()=>{
console.log("test fecth type")
console.log(childStats)

},[childStats])


  const isLoading =
    userLoad || childLoad || listLoad || empLoad ||
    sgLoad || eduLoad || auditLoad || wfLoad || finLoad || nutLoad || trendLoad;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <DashbordNav user={user} />
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8  mx-auto ">
        <DashboardBody
          user={user?.data ?? user}
          childStats={childStats?.data}
          recentChildren={(children?.data ?? []).slice(0, 5)}
          employees={employees?.data ?? employees ?? []}
          safeguardingCases={safeguarding?.data ?? []}
          eduAlerts={eduAlerts?.data ?? []}
          auditLogs={auditLogs?.data ?? []}
          pendingWorkflows={workflows?.data ?? []}
          financialReport={financialReport?.data ?? {}}
          nutritionAlerts={nutritionAlerts?.data ?? []}
          trendData={trendData?.data ?? []}
        />
      </main>
    </div>
  );
};

export default DashboardPage;
