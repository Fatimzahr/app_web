import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import QuestionList   from './pages/questions/QuestionList';
import QuestionDetail from './pages/questions/QuestionDetail';
import QuestionCreate from './pages/questions/QuestionCreate';
import Profile        from './pages/profile/Profile';
import Moderation     from './pages/moderation/Moderation';

// Components
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

// Route protégée — redirige vers login si non connecté
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '10px',
              padding: '12px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Routes publiques */}
          <Route path="/"        element={<QuestionList />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />

          {/* Routes protégées */}
          <Route path="/poser-question" element={
            <PrivateRoute><QuestionCreate /></PrivateRoute>
          }/>
          <Route path="/profil" element={
            <PrivateRoute><Profile /></PrivateRoute>
          }/>
          <Route path="/moderation" element={
            <PrivateRoute><Moderation /></PrivateRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;