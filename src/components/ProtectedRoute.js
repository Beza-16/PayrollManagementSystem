import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isValidating, userRole } = useSelector((state) => state.auth);
  console.log('ProtectedRoute state:', { isAuthenticated, isValidating, userRole });

  if (isValidating) {
    return <div>Loading...</div>; // Show loading state during validation
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && userRole.toLowerCase() !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;