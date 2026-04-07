import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'sonner';
import {AuthProvider} from './contexts/AuthContext';
import {ThemeProvider} from './contexts/ThemeContext';
import {CurrencyProvider} from './contexts/CurrencyContext';
import {LanguageProvider} from './contexts/LanguageContext';
import './i18n';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import ProfilePage from './pages/ProfilePage';
import RecurringTransactionsPage from './pages/RecurringTransactionsPage';
import GoalsPage from './pages/GoalsPage';
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import EmailChangeConfirmationPage from "./pages/EmailChangeConfirmationPage.jsx";
import CurrencyConverter from './components/currency/CurrencyConverter';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <ThemeProvider>
            <Router>
            <Toaster position="top-right" richColors/>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage/>}/>
              <Route path="/register" element={<RegisterPage/>}/>
              <Route path="/login" element={<LoginPage/>}/>
              <Route path="/oauth2/callback" element={<OAuth2CallbackPage/>}/>

              {/* Protected routes with Layout */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Layout>
                      <DashboardPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <PrivateRoute>
                    <Layout>
                      <TransactionsPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CategoriesPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/budgets"
                element={
                  <PrivateRoute>
                    <Layout>
                      <BudgetsPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ProfilePage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/recurring"
                element={
                  <PrivateRoute>
                    <Layout>
                      <RecurringTransactionsPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <PrivateRoute>
                    <Layout>
                      <GoalsPage/>
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/currency-converter"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CurrencyConverter />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route path="/verify-email" element={<EmailVerificationPage/>}/>
              <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
              <Route path="/reset-password" element={<ResetPasswordPage/>}/>
              <Route path="/confirm-email-change" element={<EmailChangeConfirmationPage />} />
            </Routes>
            </Router>
            </ThemeProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
