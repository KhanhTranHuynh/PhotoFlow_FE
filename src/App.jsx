import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { lazyRetry } from "@/router/lazyRetry";
/////////////////
const Dashboard = lazyRetry(() => import("./pages/dashboard"));
const Ecommerce = lazyRetry(() => import("./pages/dashboard/ecommerce"));
const CrmPage = lazyRetry(() => import("./pages/dashboard/crm"));
const ProjectPage = lazyRetry(() => import("./pages/dashboard/project"));
const BankingPage = lazyRetry(() => import("./pages/dashboard/banking"));
const TodoPage = lazyRetry(() => import("./pages/app/todo"));
const EmailPage = lazyRetry(() => import("./pages/app/email"));
const ProjectPostPage = lazyRetry(() => import("./pages/app/projects"));
const ProjectDetailsPage = lazyRetry(
  () => import("./pages/app/projects/project-details"),
);
const KanbanPage = lazyRetry(() => import("./pages/app/kanban"));
const CalenderPage = lazyRetry(() => import("./pages/app/calender"));
const Button = lazyRetry(() => import("./pages/components/button"));
const Dropdown = lazyRetry(() => import("./pages/components/dropdown"));
const Badges = lazyRetry(() => import("./pages/components/badges"));
const Colors = lazyRetry(() => import("./pages/components/colors"));
const Typography = lazyRetry(() => import("./pages/components/typography"));
const Alert = lazyRetry(() => import("./pages/components/alert"));
const Progressbar = lazyRetry(() => import("./pages/components/progress-bar"));
const Card = lazyRetry(() => import("./pages/components/card"));
const Image = lazyRetry(() => import("./pages/components/image"));
const Placeholder = lazyRetry(() => import("./pages/components/placeholder"));
const Tooltip = lazyRetry(() => import("./pages/components/tooltip-popover"));
const Modal = lazyRetry(() => import("./pages/components/modal"));
const Carousel = lazyRetry(() => import("./pages/components/carousel"));
const Pagination = lazyRetry(() => import("./pages/components/pagination"));
const TabsAc = lazyRetry(() => import("./pages/components/tab-accordion"));
const Video = lazyRetry(() => import("./pages/components/video"));
const InputPage = lazyRetry(() => import("./pages/forms/input"));
const TextareaPage = lazyRetry(() => import("./pages/forms/textarea"));
const CheckboxPage = lazyRetry(() => import("./pages/forms/checkbox"));
const RadioPage = lazyRetry(() => import("./pages/forms/radio-button"));
const SwitchPage = lazyRetry(() => import("./pages/forms/switch"));
const InputGroupPage = lazyRetry(() => import("./pages/forms/input-group"));
const InputlayoutPage = lazyRetry(() => import("./pages/forms/input-layout"));
const InputMask = lazyRetry(() => import("./pages/forms/input-mask"));
const FormValidation = lazyRetry(() => import("./pages/forms/form-validation"));
const FileInput = lazyRetry(() => import("./pages/forms/file-input"));
const FormRepeater = lazyRetry(() => import("./pages/forms/form-repeater"));
const FormWizard = lazyRetry(() => import("./pages/forms/form-wizard"));
const SelectPage = lazyRetry(() => import("./pages/forms/select"));
const Flatpicker = lazyRetry(() => import("./pages/forms/date-time-picker"));
const AppexChartPage = lazyRetry(() => import("./pages/chart/appex-chart"));
const ChartJs = lazyRetry(() => import("./pages/chart/chartjs"));
const Recharts = lazyRetry(() => import("./pages/chart/recharts"));
const MapPage = lazyRetry(() => import("./pages/map"));
const BasicTablePage = lazyRetry(() => import("./pages/table/table-basic"));
const TanstackTable = lazyRetry(() => import("./pages/table/react-table"));
const InvoicePage = lazyRetry(() => import("./pages/utility/invoice"));
const InvoiceAddPage = lazyRetry(() => import("./pages/utility/invoice-add"));
const InvoicePreviewPage = lazyRetry(
  () => import("./pages/utility/invoice-preview"),
);
const InvoiceEditPage = lazyRetry(() => import("./pages/utility/invoice-edit"));
const PricingPage = lazyRetry(() => import("./pages/utility/pricing"));
const BlankPage = lazyRetry(() => import("./pages/utility/blank-page"));
const ComingSoonPage = lazyRetry(() => import("./pages/utility/coming-soon"));
const UnderConstructionPage = lazyRetry(
  () => import("./pages/utility/under-construction"),
);
const BlogPage = lazyRetry(() => import("./pages/utility/blog"));
const BlogDetailsPage = lazyRetry(
  () => import("./pages/utility/blog/blog-details"),
);
const FaqPage = lazyRetry(() => import("./pages/utility/faq"));
const Settings = lazyRetry(() => import("./pages/utility/settings"));
const Profile = lazyRetry(() => import("./pages/utility/profile"));
const IconPage = lazyRetry(() => import("./pages/icons"));
const NotificationPage = lazyRetry(
  () => import("./pages/utility/notifications"),
);
const ChangelogPage = lazyRetry(() => import("./pages/changelog"));
const BasicWidget = lazyRetry(() => import("./pages/widget/basic-widget"));
const StatisticWidget = lazyRetry(
  () => import("./pages/widget/statistic-widget"),
);

/////////////////

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getCookie } from "@/utils/cookies";
import ProtectedRoute from "@/router/ProtectedRoute";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useDocumentTitleNotification } from "@/hooks/useDocumentTitleNotification";
import { getUserRoleCodes } from "@/utils/getUserRoleCodes";
import { unlockAudio } from "@/helpers/notificationSound";

import { fetchProfile, setAuthInitialized } from "@/store/redux/auth";

import { ApiRequestManager } from "@/api/apiRequestManager";
import GlobalOverlayLoading from "@/components/ui/GlobalOverlayLoading";

// home pages  & dashboard

const TrangChu = lazyRetry(() => import("./pages/main/trang-chu"));
const KhachHang = lazyRetry(() => import("./pages/main/khach-hang"));
const NhanVien = lazyRetry(() => import("./pages/main/nhan-vien"));
const Album = lazyRetry(() => import("./pages/main/album"));
const Log = lazyRetry(() => import("./pages/main/log"));

const Login = lazyRetry(() => import("./pages/auth/login"));
const Register = lazyRetry(() => import("./pages/auth/register"));
const ForgotPassword = lazyRetry(() => import("./pages/auth/forgot-password"));

const SsoEntry = lazyRetry(() => import("./pages/SsoEntry/SsoEntry"));

const Error = lazyRetry(() => import("./pages/404"));

import Layout from "./layout/Layout";

import Loading from "@/components/Loading";
import { getAuthRedirectPath } from "@/utils/getAuthRedirectPath";

function hasAuthCookies() {
  const accessToken = getCookie("accessToken");
  const refreshToken = getCookie("refreshToken");
  return !!accessToken && !!refreshToken;
}

function RootRedirect() {
  const user = useSelector((state) => state.auth.user);
  const roleCodes = getUserRoleCodes(user);

  return (
    <Navigate
      to={hasAuthCookies() ? getAuthRedirectPath(roleCodes) : "/login"}
      replace
    />
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  useEffect(() => {
    console.error("[ErrorBoundary]", {
      message: error?.message,
      isChunkError: error?.isChunkError,
      stack: error?.stack,
      time: new Date().toISOString(),
      url: window.location.href,
    });
  }, []);

  // Lỗi chunk load → cho reload
  if (error?.isChunkError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-2">
        <div>Không thể tải trang</div>
        <div style={{ fontSize: 12, color: "red" }}>{error?.message}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-primary-500 text-white">
          Tải lại trang
        </button>
      </div>
    );
  }

  // Lỗi logic (ID sai, runtime error...) → quay lại, không reload
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-2">
      <div>Đã xảy ra lỗi</div>
      <div style={{ fontSize: 12, color: "red" }}>{error?.message}</div>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 rounded bg-primary-500 text-white">
        Quay lại
      </button>
    </div>
  );
}

function App() {
  // useNotificationSocket();

  const unreadCount = useSelector(
    (state) => state.notification.items?.unread_count ?? 0,
  );
  useDocumentTitleNotification({ unreadCount, appTitle: "HT - LabsFlow" });

  const dispatch = useDispatch();
  const location = useLocation();

  const authInitialized = useSelector((state) => state.auth.authInitialized);
  const user = useSelector((state) => state.auth.user);

  // ✅ State loading toàn app cho ApiRequestManager
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    // Cấu hình 1 lần: giới hạn 10 batch song song, mặc định không tự bật overlay
    // (bật overlay theo từng lần gọi qua showOverlay: true)
    ApiRequestManager.configure({
      maxConcurrentBatches: 10,
      defaultShowOverlay: true,
      onCallbackError: (error, request) => {
        console.error(
          "[ApiRequestManager callback error]",
          request.apiUrl,
          error,
        );
      },
    });

    const cleanup = ApiRequestManager.setOverlayHandler((visible) => {
      setGlobalLoading(visible);
    });

    return cleanup;
  }, []);

  useEffect(() => {
    const token = getCookie("accessToken");
    if (token) {
      dispatch(fetchProfile());
    } else {
      dispatch(setAuthInitialized());
    }

    const unlock = async () => {
      try {
        console.log("[audio] user interacted → unlocking...");
        await unlockAudio();
        // ✅ Bỏ window.__audioContext, unlockAudio tự log state rồi
      } catch (err) {
        console.error("[audio unlock failed]", err);
      } finally {
        // ✅ Remove listener dù thành công hay thất bại
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("pointerdown", unlock);
      }
    };

    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", unlock, {
      once: true,
      passive: true,
    });

    // ✅ Dùng { once: true } thì không cần removeEventListener trong cleanup
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  // chưa init auth xong
  if (!authInitialized) {
    return <Loading />;
  }

  return (
    <main className="App relative">
      {globalLoading && <GlobalOverlayLoading />}

      {/* <ErrorBoundary FallbackComponent={ErrorFallback}> */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/sso-entry"
            element={
              <Suspense fallback={<Loading />}>
                <SsoEntry />
              </Suspense>
            }
          />

          <Route
            path="/login"
            element={
              <Suspense fallback={<Loading />}>
                <Login />
              </Suspense>
            }
          />

          <Route
            path="/register"
            element={
              <Suspense fallback={<Loading />}>
                <Register />
              </Suspense>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<Loading />}>
                <ForgotPassword />
              </Suspense>
            }
          />

          <Route
            path="/404"
            element={
              <Suspense fallback={<Loading />}>
                <Error />
              </Suspense>
            }
          />

          <Route path="/*" element={<Layout />}>
            <Route
              path="trang-chu"
              element={
                <ProtectedRoute menuKey="trang_chu">
                  <TrangChu />
                </ProtectedRoute>
              }
            />
            <Route
              path="nhan-vien"
              element={
                <ProtectedRoute menuKey="nhan_vien">
                  <NhanVien />
                </ProtectedRoute>
              }
            />
            <Route
              path="khach-hang"
              element={
                <ProtectedRoute menuKey="khach_hang">
                  <KhachHang />
                </ProtectedRoute>
              }
            />
            <Route
              path="album"
              element={
                <ProtectedRoute menuKey="album">
                  <Album />
                </ProtectedRoute>
              }
            />
            <Route
              path="log"
              element={
                <ProtectedRoute menuKey="log">
                  <Log />
                </ProtectedRoute>
              }
            />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ecommerce" element={<Ecommerce />} />
            <Route path="crm" element={<CrmPage />} />
            <Route path="project" element={<ProjectPage />} />
            <Route path="banking" element={<BankingPage />} />
            {/* App pages */}
            <Route path="todo" element={<TodoPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="projects" element={<ProjectPostPage />} />
            <Route path={"projects/:id"} element={<ProjectDetailsPage />} />
            <Route path="project-details" element={<ProjectDetailsPage />} />
            <Route path="kanban" element={<KanbanPage />} />
            <Route path="calender" element={<CalenderPage />} />
            {/* Components pages */}
            <Route path="button" element={<Button />} />
            <Route path="dropdown" element={<Dropdown />} />
            <Route path="badges" element={<Badges />} />
            <Route path="colors" element={<Colors />} />
            <Route path="typography" element={<Typography />} />
            <Route path="alert" element={<Alert />} />
            <Route path="progress-bar" element={<Progressbar />} />
            <Route path="card" element={<Card />} />
            <Route path="image" element={<Image />} />
            <Route path="Placeholder" element={<Placeholder />} />
            <Route path="tooltip-popover" element={<Tooltip />} />
            <Route path="modal" element={<Modal />} />
            <Route path="carousel" element={<Carousel />} />
            <Route path="Paginations" element={<Pagination />} />
            <Route path="tab-accordion" element={<TabsAc />} />
            <Route path="video" element={<Video />} />
            <Route path="input" element={<InputPage />} />
            <Route path="textarea" element={<TextareaPage />} />
            <Route path="checkbox" element={<CheckboxPage />} />
            <Route path="radio-button" element={<RadioPage />} />
            <Route path="switch" element={<SwitchPage />} />
            <Route path="input-group" element={<InputGroupPage />} />
            <Route path="input-layout" element={<InputlayoutPage />} />
            <Route path="input-mask" element={<InputMask />} />
            <Route path="form-validation" element={<FormValidation />} />
            <Route path="file-input" element={<FileInput />} />
            <Route path="form-repeater" element={<FormRepeater />} />
            <Route path="form-wizard" element={<FormWizard />} />
            <Route path="select" element={<SelectPage />} />
            <Route path="date-time-picker" element={<Flatpicker />} />
            <Route path="appex-chart" element={<AppexChartPage />} />
            <Route path="chartjs" element={<ChartJs />} />
            <Route path="recharts" element={<Recharts />} />
            <Route path="map" element={<MapPage />} />
            <Route path="table-basic" element={<BasicTablePage />} />
            <Route path="react-table" element={<TanstackTable />} />
            <Route path="invoice" element={<InvoicePage />} />
            <Route path="invoice-add" element={<InvoiceAddPage />} />
            <Route path="invoice-preview" element={<InvoicePreviewPage />} />
            <Route path="invoice-edit" element={<InvoiceEditPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="blank-page" element={<BlankPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog-details" element={<BlogDetailsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="basic" element={<BasicWidget />} />
            <Route path="statistic" element={<StatisticWidget />} />
            <Route path="icons" element={<IconPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Route>
        </Routes>
      </Suspense>
      {/* </ErrorBoundary> */}
    </main>
  );
}

export default App;
