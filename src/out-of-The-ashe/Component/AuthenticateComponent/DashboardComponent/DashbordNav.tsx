import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faSearch, 
  faHouse, 
  faPlus,
  faUserPlus,
  faAddressCard,
  faGear,
  faUnlockKeyhole,
  faCircleQuestion,
  faRightFromBracket,
  faChildReaching,
  faBell,
  faCheckDouble,
  faTriangleExclamation,
  faMoneyBillWave,
  faHouseChimneyUser,
  faGraduationCap,
  faCircleInfo,
  faShieldHalved,
  faBullhorn,
  faClipboardList,
  faCalendarCheck,
  faClock,
  faCalendarDay,
  faInbox
} from '@fortawesome/free-solid-svg-icons';

// Redux & Config
import { logout } from '../../../Redux/auth';
import { useGetUserQuery } from '../../../Redux/User';
import { useGetChildbyNameQuery } from '../../../Redux/Childes';
import { useGetPermissionsOwnQuery } from '../../../Redux/Employee';
import { 
  useGetMyNotificationsQuery, 
  useGetUnreadCountQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation 
} from '../../../Redux/Notification';

const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;
const DashbordNav = () => {
  // --- States ---
  const [isDisplayADd, SetIsDisplay] = useState(false);
  const [isDisplayNavList, setIsDisplayNavList] = useState(false);
  const [isDisplaySettingControl, setIsDisplaySettingControl] = useState(false);
  const [isDisplayNotif, setIsDisplayNotif] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [filterUser, setFilteruser] = useState<any>({});

  // --- Refs ---
  const addMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // --- Redux & Navigation ---
  const Dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);
  
  const { data: newperm } = useGetPermissionsOwnQuery();
  const id = user.id;
  const role = user.role;
  const { data: User } = useGetUserQuery(id);

  // ✅ FIX: skip query until user has typed at least 2 characters
  const { data: childResult, isFetching: isSearching } = useGetChildbyNameQuery(searchValue, {
    skip: searchValue.length < 2,
  });

  // --- Notification Data ---
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 10000,
  });

  // Added `refetch` alias to manually pull fresh notifications when the bell is clicked
  const { 
    data: notifData, 
    isFetching: isLoadingNotifs, 
    refetch: refetchNotifications 
  } = useGetMyNotificationsQuery(
    { page: 1 },
   { 
      skip: !isDisplayNotif
    }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const unreadCount = unreadData?.count || 0;

  const [permissions, Setnewperm] = useState<any>({});

  useEffect(() => {
    Setnewperm(newperm?.data);
  }, [newperm]);

  useEffect(() => {
    if (User) {
      setFilteruser(User.data);
    }
  }, [User]);
   const { isAuthenticate } = useSelector((state) => state.auth);
   
  
    useEffect(() => {
      if (!isAuthenticate) navigate('/loginpage');
    }, [isAuthenticate, navigate]);
  
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

  // --- Configuration Arrays ---
  const NavList = [
    { icon: faHouse, Text: "Dashboard", resposivehidden: true, type: "Dashbord" },
    { icon: faPlus, Text: "Add New", resposivehidden: true, type: "add" },
    { icon: faAddressCard, Text: "Profile", resposivehidden: false, type: "profile" },
    { icon: faGear, Text: "Setting", resposivehidden: false, type: "setting" },
    { icon: faRightFromBracket, Text: "Logout", resposivehidden: false, type: "logout", color: "text-rose-500" }
  ];
  
  const canRegisterChild    = user.role === "ADMIN" || role === "SOCIAL_WORKER"; 
  const canRegisterEmployee = user.role === "ADMIN"
  const hasAnyAddAction     = canRegisterChild || canRegisterEmployee

  const ListAdd = [
    { icon: faChildReaching, Text: "Register New Child", type: 'child',    bg: "bg-black/80", textColor: "text-white", visible: canRegisterChild },
    { icon: faUserPlus,      Text: "Employee Account",   type: 'employee', bg: "bg-black/90", textColor: "text-white", visible: canRegisterEmployee },
  ];

  const ListSetting = [
    { icon: faUnlockKeyhole, Text: "Change Password", type: 'passwordChange' },
    { icon: faCircleQuestion, Text: "FAQs & Support", type: 'FQA' }
  ];

  // --- Notification helpers ---
  // FIX: previously SAFEGUARDING_ALERT and SECURITY_WARNING both used
  // faTriangleExclamation, making them indistinguishable at a glance. Also
  // added the 5 enum types (visit/appointment/reminder notifications) that
  // were falling through to the generic default icon. Kept in sync with
  // NotificationsPage.tsx so the same type always looks the same everywhere.
  const getNotifMeta = (type: string) => {
    switch (type) {
      case 'SAFEGUARDING_ALERT':
        return { icon: faShieldHalved, color: 'text-rose-500', bg: 'bg-rose-50' };
      case 'FINANCIAL_APPROVAL_REQUEST':
        return { icon: faMoneyBillWave, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'HOME_VISIT_DUE':
        return { icon: faHouseChimneyUser, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'ACADEMIC_ALERT':
        return { icon: faGraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'SYSTEM_ANNOUNCEMENT':
        return { icon: faBullhorn, color: 'text-indigo-500', bg: 'bg-indigo-50' };
      case 'NEW_VISIT_LOGGED':
        return { icon: faClipboardList, color: 'text-sky-500', bg: 'bg-sky-50' };
      case 'NEW_APPOINTMENT_ASSIGNED':
        return { icon: faCalendarCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' };
      case 'UPCOMING_REMINDER':
        return { icon: faClock, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'TODAY_VISIT_ALERT':
        return { icon: faCalendarDay, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'EMERGENCY_ALERT':
        return { icon: faTriangleExclamation, color: 'text-red-600', bg: 'bg-red-50' };
      case 'SECURITY_WARNING':
        return { icon: faTriangleExclamation, color: 'text-red-600', bg: 'bg-red-50' };
      case 'DATA_CREATE':
      case 'DATA_UPDATE':
      case 'DATA_DELETE':
        return { icon: faCircleInfo, color: 'text-violet-500', bg: 'bg-violet-50' };
      default:
        return { icon: faCircleInfo, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) markAsRead(notif.id);
    setIsDisplayNotif(false);

    switch (notif.entityType) {
      case 'SAFEGUARDING_CASE':
        navigate(`/SafeguardingCase/${notif.relatedId}`);
        break;
      case 'FINANCIAL_SUPPORT':
        navigate(`/FinancialSupport/${notif.relatedId}`);
        break;
      case 'HOME_VISIT':
        navigate(`/HomeVisit/${notif.relatedId}`);
        break;
      case 'ACADEMIC_RECORD':
        navigate(`/AcademicRecord/${notif.relatedId}`);
        break;
      case 'CHILD':
        navigate(`/ChildSingle/${notif.relatedId}`);
        break;
      case 'APPOINTMENT':
        navigate(`/HomeVisit/${notif.relatedId}`);
        break;
      default:
        navigate('/Notifications');
    }
  };

  // --- Effects ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) SetIsDisplay(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsDisplayNavList(false);
        setIsDisplaySettingControl(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsDisplayNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleNotificationBellClick = () => {
    const nextDisplayState = !isDisplayNotif;
    setIsDisplayNotif(nextDisplayState);

    // Forces immediate refetch only when opening the menu dropdown container
    if (nextDisplayState) {
      refetchNotifications();
    }
  };

  const NavListControl = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "add") SetIsDisplay(!isDisplayADd);
    else if (type === "setting") setIsDisplaySettingControl(!isDisplaySettingControl);
    else if (type === "Dashbord") navigate("/DashboardPage");
    else if (type === "profile") navigate('/ProfilePage');
    else if (type === "logout") Dispatch(logout());
    
    if (type !== 'add' && type !== 'setting') setIsDisplayNavList(false);
  };

  const handleAction = (type: string) => {
    if (type === 'child') navigate('/ChildRegister');
    if (type === 'employee') navigate('/EmployeerRgister');
    if (type === 'passwordChange') navigate('/PasswordChange');
    SetIsDisplay(false);
    setIsDisplayNavList(false);
  };

  // ✅ FIX: backend returns { data: [...], meta: {...} } so unwrap .data
  const children = childResult?.data ?? [];

  return (
    <nav className={`fixed top-0 inset-x-0 h-20 z-[100] transition-all duration-500 px-6 flex items-center justify-between
      ${isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-white/40 backdrop-blur-sm'}`}>
      
      {/* Brand */}
      <Link to="/DashboardPage" className="flex-shrink-0">
        <img src="https://res.cloudinary.com/dkzvlqjp9/image/upload/v1767960857/out_1_ligvau.png" 
             alt="Logo" className="h-10 w-auto object-contain max-sm:hidden" />
      </Link>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-4 md:mx-8 relative">
        <div className="relative group">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primBtn transition-colors" />
          <input 
            type="search" 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search records..." 
            className="w-full bg-primBtn/10 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 py-2.5 pl-11 pr-10 rounded-2xl outline-none transition-all text-sm font-medium"
          />
        </div>

        {searchValue.length >= 2 && (
          <div className="absolute top-14 inset-x-0 bg-white border border-slate-100 rounded-3xl shadow-2xl p-2 z-[110] animate-in fade-in slide-in-from-top-2">
            {isSearching ? (
              <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse uppercase">Searching...</div>
            ) : children.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {children.map((child: any) => (
                  <Link
                    key={child.id}                              // ✅ Prisma uses `id` not `_id`
                    to={`/ChildSingle/${child.id}`}            // ✅ Prisma uses `id` not `_id`
                    onClick={() => setSearchValue('')}
                    className="flex items-center gap-4 p-3 hover:bg-blue-50 rounded-2xl transition-all group"
                  >
                    {/* ✅ photos[0].url from Prisma, prepend localhost for local storage */}
                    <img
                      src={
                        child.photos?.[0]?.url
                          ? `http://localhost:5000${child.photos[0].url}`
                          : '/placeholder-avatar.png'
                      }
                      className="w-11 h-11 rounded-xl object-contain ring-2 ring-white shadow-sm"
                      alt=""
                    />
                    <div>
                      {/* ✅ firstName / lastName (not childFirstName / childLastName) */}
                      <p className="font-bold searchresult text-slate-800 text-sm">
                        {child.firstName} {child.lastName}
                      </p>
                      {/* ✅ No `Grade` field in schema — using subCity or schoolName */}
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {child.schoolName ?? child.subCity ?? '—'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 notfoundseacrhresult text-center text-sm text-slate-400 font-medium">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-5">
        <Link to="/DashboardPage" className="p-2 text-slate-400 hover:text-Hover transition-all max-md:hidden">
          <FontAwesomeIcon icon={faHouse} size="lg" />
        </Link>

        {/* Notification Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={handleNotificationBellClick}
            aria-label="Notifications"
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isDisplayNotif ? 'bg-slate-100 text-primBtn' : 'text-slate-400 hover:text-Hover hover:bg-slate-50'}`}
          >
            <FontAwesomeIcon icon={faBell} size="lg" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex">
                {/* subtle pulse ring to draw the eye to unread notifications */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60 animate-ping" />
                <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {isDisplayNotif && (
            <div className="absolute right-0 mt-4 w-80 max-w-[90vw] bg-white border border-slate-100 rounded-[28px] shadow-2xl p-2 z-[120] animate-in zoom-in-95">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[10px] font-bold text-primBtn hover:text-Hover flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoadingNotifs ? (
                  <div className="space-y-1 p-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2 pt-0.5">
                          <div className="h-2.5 w-2/5 bg-slate-100 rounded-full" />
                          <div className="h-2.5 w-4/5 bg-slate-100 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifData?.data?.length > 0 ? (
                  notifData.data.map((notif: any) => {
                    const meta = getNotifMeta(notif.type);
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`flex w-full items-start gap-3 p-3 rounded-2xl transition-all text-left
                        ${!notif.isRead ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                          <FontAwesomeIcon icon={meta.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-slate-800 truncate">{notif.title}</p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400">{timeAgo(notif.createdAt)}</span>
                            {notif.priority === 'URGENT' && (
                              <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-50 px-1.5 py-0.5 rounded-md">Urgent</span>
                            )}
                            {notif.priority === 'HIGH' && (
                              <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-50 px-1.5 py-0.5 rounded-md">High</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-2">
                      <FontAwesomeIcon icon={faInbox} />
                    </div>
                    <p className="text-xs font-bold text-slate-400">You're all caught up</p>
                  </div>
                )}
              </div>

              <Link
                to="/Notifications"
                onClick={() => setIsDisplayNotif(false)}
                className="block text-center text-xs font-bold text-primBtn hover:text-Hover py-3 mt-1 border-t border-slate-100"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Desktop Add Button */}
        <div className="relative max-md:hidden" ref={addMenuRef}>
          {hasAnyAddAction && (
            <button
              onClick={() => SetIsDisplay(!isDisplayADd)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-slate-200 
              ${isDisplayADd ? 'bg-Hover text-white rotate-45' : 'bg-primBtn text-white'}`}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}

          {isDisplayADd && hasAnyAddAction && (
            <div className="absolute right-0 mt-4 w-64 bg-white border border-slate-100 rounded-[28px] shadow-2xl p-2 z-[120] animate-in zoom-in-95">
              <p className="text-[10px] font-black text-slate-400 uppercase p-4 pb-2 tracking-widest">Quick Actions</p>
              {ListAdd.filter(item => item.visible).map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAction(item.type)}
                  className="flex w-full items-center gap-3 p-3 hover:bg-Hover/10 rounded-2xl transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.textColor} flex items-center justify-center group-hover:bg-Hover group-hover:text-white transition-all`}>
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  <span className="font-bold text-sm text-slate-700">{item.Text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-2 max-sm:hidden" />

        {/* Profile / Mobile Combined Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setIsDisplayNavList(!isDisplayNavList)}
            className={`flex items-center gap-2 p-1 rounded-2xl transition-all border border-transparent ${isDisplayNavList ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
          >
            <img src={`${API_URL}${filterUser?.avatarUrl}`} className="w-10 h-10 rounded-xl object-contain shadow-sm ring-2 ring-white" alt="profile" />
            <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] text-slate-400 transition-transform duration-300 ${isDisplayNavList ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {isDisplayNavList && (
            <div className="absolute right-0 mt-4 w-64 bg-white border border-slate-100 rounded-[28px] shadow-2xl p-2 z-[120] animate-in zoom-in-95">
              <div className="px-4 py-4 mb-2 bg-slate-50 rounded-2xl text-left border border-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Connected as</p>
                <p className="text-sm font-black text-slate-800 truncate">{filterUser?.firstName} {filterUser?.lastName}</p>
                <p className="text-[9px] font-bold text-primBtn uppercase mt-0.5">{User?.role}</p>
              </div>

              {NavList.map((list) => (
                <div key={list.type} className={list.resposivehidden ? 'md:hidden' : 'block'}>
                  <button 
                    onClick={(e) => NavListControl(list.type, e)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group"
                  >
                    <div className={`flex items-center gap-3 font-bold text-sm ${list.color || 'text-slate-600 group-hover:text-slate-900'}`}>
                      <FontAwesomeIcon icon={list.icon} className={`${list.color ? 'text-rose-400' : 'text-slate-400 group-hover:text-primBtn'}`} />
                      {list.Text}
                    </div>
                    {(list.type === 'add' || list.type === 'setting') && 
                      <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${((list.type==='add' && isDisplayADd) || (list.type==='setting' && isDisplaySettingControl)) ? 'rotate-180 text-blue-600' : 'text-slate-300'}`} />
                    }
                  </button>

                  {/* Mobile Add Nested */}
                  {list.type === 'add' && isDisplayADd && (
                    <div className="mx-2 my-1 space-y-1 animate-in slide-in-from-left-2 bg-slate-50/50 rounded-xl p-1">
                      {ListAdd.filter(item => item.visible).map(item => (
                        <button
                          key={item.type}
                          onClick={(e) => { e.stopPropagation(); handleAction(item.type); }}
                          className="flex w-full items-center gap-3 p-3 text-xs font-bold text-slate-500 hover:text-primBtn hover:bg-white rounded-lg transition-all"
                        >
                          <FontAwesomeIcon icon={item.icon} className="w-4 opacity-70" /> {item.Text}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Setting Nested */}
                  {list.type === 'setting' && isDisplaySettingControl && (
                    <div className="mx-2 my-1 space-y-1 animate-in slide-in-from-left-2 bg-slate-50/50 rounded-xl p-1">
                      {ListSetting.map(st => (
                        <button 
                          key={st.type} 
                          onClick={(e) => { e.stopPropagation(); handleAction(st.type); }} 
                          className="w-full text-left p-3 text-xs font-bold text-slate-500 hover:text-primBtn flex items-center gap-3 hover:bg-white rounded-lg transition-all"
                        >
                          <FontAwesomeIcon icon={st.icon} className="w-4 opacity-70" /> {st.Text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashbordNav;