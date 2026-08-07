import { Navigate } from 'react-router-dom';
import { getUser } from '../api.js';

export default function ProtectedRoute({ children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
