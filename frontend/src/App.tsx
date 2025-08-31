// frontend/src/App.tsx
import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Context Providers
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Components
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingScreen from "./components/common/LoadingScreen";
import Layout from "./components/common/Layout";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Settings = lazy(() => import("./pages/Settings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const APIKeys = lazy(() => import("./pages/APIKeys"));
const Billing = lazy(() => import("./pages/Billing"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3,
};

// Loading fallback component
const PageFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
      <p className="text-sm text-gray-600">Preparing your workspace</p>
    </div>
  </div>
);

// Protected Route component with enhanced features
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPlan?: "free" | "pro" | "enterprise";
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPlan,
  requiredPermissions,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to landing if not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // Check plan requirements (if specified)
  if (requiredPlan && user.plan && !checkPlanAccess(user.plan, requiredPlan)) {
    return <Navigate to="/billing" state={{ requiredPlan }} replace />;
  }

  // Check permissions (if specified)
  if (
    requiredPermissions &&
    !checkPermissions(user.permissions, requiredPermissions)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Animated page wrapper
interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = "",
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`min-h-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Main App Router Component
const AppRouter: React.FC = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes location={location}>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <AnimatedPage>
              <Landing />
            </AnimatedPage>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <AnimatedPage>
                  <Dashboard />
                </AnimatedPage>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <Layout>
                <AnimatedPage>
                  <Integrations />
                </AnimatedPage>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/workflows"
          element={
            <ProtectedRoute>
              <Layout>
                <AnimatedPage>
                  <Workflows />
                </AnimatedPage>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredPlan="pro">
              <Layout>
                <AnimatedPage>
                  <Analytics />
                </AnimatedPage>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route
                    index
                    element={
                      <AnimatedPage>
                        <Settings />
                      </AnimatedPage>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <AnimatedPage>
                        <Profile />
                      </AnimatedPage>
                    }
                  />
                  <Route
                    path="api-keys"
                    element={
                      <AnimatedPage>
                        <APIKeys />
                      </AnimatedPage>
                    }
                  />
                  <Route
                    path="billing"
                    element={
                      <AnimatedPage>
                        <Billing />
                      </AnimatedPage>
                    }
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            <AnimatedPage>
              <NotFound />
            </AnimatedPage>
          }
        />
      </Routes>
    </Suspense>
  );
};

// Main App Component
const App: React.FC = () => {
  useEffect(() => {
    // Set up global error handling
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      // You could send this to your error tracking service
    });

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", () => {});
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <Router>
                <div className="App font-inter antialiased">
                  <AppRouter />

                  {/* Global Toast Notifications */}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: "#363636",
                        color: "#fff",
                        borderRadius: "8px",
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      },
                      success: {
                        style: {
                          background: "#10b981",
                        },
                      },
                      error: {
                        style: {
                          background: "#ef4444",
                        },
                      },
                    }}
                  />
                </div>
              </Router>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Utility Functions
const checkPlanAccess = (userPlan: string, requiredPlan: string): boolean => {
  const planHierarchy = ["free", "pro", "enterprise"];
  const userPlanIndex = planHierarchy.indexOf(userPlan);
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
  return userPlanIndex >= requiredPlanIndex;
};

const checkPermissions = (
  userPermissions: string[] = [],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

export default App;
