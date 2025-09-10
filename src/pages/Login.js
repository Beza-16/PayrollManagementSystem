import React, { useState, useEffect } from 'react';
import './Login.css';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, clearMessages, fetchUserRole } from '../slices/authSlice';
import axios from 'axios';

const Login = () => {
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '', roleId: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);

  useEffect(() => {
    if (successMessage && view === 'signup') {
      setView('login');
      alert(successMessage);
      dispatch(clearMessages());
    }
  }, [successMessage, view, dispatch]);

  const toggleForm = () => {
    setView(view === 'login' ? 'signup' : 'login');
    setFormData({ username: '', email: '', password: '', roleId: '' });
    dispatch(clearMessages());
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotChange = (e) => {
    setForgotEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (view === 'login') {
      if (!formData.email || !formData.password) {
        alert('Please enter both email and password');
        return;
      }
      dispatch(loginUser({ email: formData.email, password: formData.password }))
        .then(() => dispatch(fetchUserRole()))
        .catch((err) => {
          console.error('Login failed:', err);
          alert('Login failed. Please try again.');
        });
    } else if (view === 'signup') {
      if (!formData.username || !formData.email || !formData.password || !formData.roleId) {
        alert('Please fill in all fields for registration');
        return;
      }
      dispatch(
        registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
        })
      );
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://localhost:14686/api/auth/forgot-password', {
        email: forgotEmail,
      });
      setForgotMessage(response.data.message);
      setView('login');
    } catch (error) {
      setForgotMessage(error.response?.data?.error || 'Failed to send reset link');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${view}`}>
        <div className="auth-image">
          <img src={view === 'login' ? '/login.jpg' : '/sign up.jpg'} alt="Auth Visual" />
        </div>
        <div className="auth-form">
          {view === 'login' && (
            <>
              <h2>Login</h2>
              {error && <p className="error-message">{error}</p>}
              {loading && <p className="loading-message">Loading...</p>}
              <form onSubmit={handleSubmit}>
                <div className="input-icon">
                  <FaEnvelope style={{ marginRight: '8px' }} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-icon">
                  <FaLock style={{ marginRight: '8px' }} />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  Login
                </button>
              </form>
              <div className="auth-links">
                <p className="forgot-password" onClick={() => setView('forgot')}>
                  Forgot Password?
                </p>
                <p className="create-account" onClick={toggleForm}>
                  Create an account
                </p>
              </div>
            </>
          )}
          {view === 'signup' && (
            <>
              <h2>Sign Up</h2>
              {error && <p className="error-message">{error}</p>}
              {loading && <p className="loading-message">Loading...</p>}
              <form onSubmit={handleSubmit}>
                <div className="input-icon">
                  <FaUser style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-icon">
                  <FaEnvelope style={{ marginRight: '8px' }} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-icon">
                  <FaLock style={{ marginRight: '8px' }} />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-icon">
                  <select name="roleId" value={formData.roleId} onChange={handleChange} required>
                    <option value="">Select Role</option>
                    <option value="3BBB0200-87A6-4CE7-BC99-C2D7055627F5">Admin</option>
                    <option value="1E09BBAE-44EE-469F-BCF4-15B22BBD4F83">Employee</option>
                    <option value="33333333-3333-3333-3333-333333333333">Manager</option>
                  </select>
                </div>
                <button type="submit" disabled={loading}>
                  Sign Up
                </button>
              </form>
              <div className="auth-links">
                <p className="create-account" onClick={toggleForm}>
                  Already have an account? Login
                </p>
              </div>
            </>
          )}
          {view === 'forgot' && (
            <>
              <h2>Forgot Password</h2>
              {error && <p className="error-message">{error}</p>}
              {loading && <p className="loading-message">Loading...</p>}
              <form onSubmit={handleForgotSubmit}>
                <div className="input-icon">
                  <FaEnvelope style={{ marginRight: '8px' }} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={handleForgotChange}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  Send Reset Link
                </button>
                <button type="button" onClick={() => setView('login')}>
                  Cancel
                </button>
              </form>
              {forgotMessage && <p className="forgot-message">{forgotMessage}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

// import React, { useState, useEffect } from 'react';
// import './Login.css';
// import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { registerUser, loginUser, clearMessages, fetchUserRole, logout, validateToken } from '../slices/authSlice';
// import axios from 'axios';

// const Login = () => {
//   const [view, setView] = useState('login');
//   const [formData, setFormData] = useState({ username: '', email: '', password: '', roleId: '' });
//   const [forgotEmail, setForgotEmail] = useState('');
//   const [forgotMessage, setForgotMessage] = useState('');
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const { isAuthenticated, loading, error, successMessage, isValidating, userRole, redirectTo } = useSelector(
//     (state) => state.auth
//   );

//   // Validate token on mount
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token && !isAuthenticated) {
//       dispatch(validateToken());
//     }
//   }, [dispatch, isAuthenticated]);

//   // Handle redirection after login
//   useEffect(() => {
//     if (isAuthenticated && !isValidating && userRole && redirectTo) {
//       if (userRole.toLowerCase() === 'admin') {
//         navigate(redirectTo || '/admin-dashboard');
//       } else {
//         dispatch(logout());
//         alert('Access denied. Only admins are authorized to log in.');
//       }
//     }
//   }, [isAuthenticated, isValidating, userRole, redirectTo, navigate, dispatch]);

//   // Handle registration success
//   useEffect(() => {
//     if (successMessage && view === 'signup') {
//       setView('login');
//       alert(successMessage);
//       dispatch(clearMessages());
//     }
//   }, [successMessage, view, dispatch]);

//   const toggleForm = () => {
//     setView(view === 'login' ? 'signup' : 'login');
//     setFormData({ username: '', email: '', password: '', roleId: '' });
//     dispatch(clearMessages());
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleForgotChange = (e) => {
//     setForgotEmail(e.target.value);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (view === 'login') {
//       if (!formData.email || !formData.password) {
//         alert('Please enter both email and password');
//         return;
//       }
//       dispatch(loginUser({ email: formData.email, password: formData.password }))
//         .then(() => dispatch(fetchUserRole()))
//         .catch((err) => {
//           console.error('Login failed:', err);
//           alert('Login failed. Please try again.');
//         });
//     } else if (view === 'signup') {
//       if (!formData.username || !formData.email || !formData.password || !formData.roleId) {
//         alert('Please fill in all fields for registration');
//         return;
//       }
//       dispatch(
//         registerUser({
//           username: formData.username,
//           email: formData.email,
//           password: formData.password,
//           roleId: formData.roleId,
//         })
//       );
//     }
//   };

//   const handleForgotSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('https://localhost:14686/api/auth/forgot-password', {
//         email: forgotEmail,
//       });
//       setForgotMessage(response.data.message);
//       setView('login');
//     } catch (error) {
//       setForgotMessage(error.response?.data?.error || 'Failed to send reset link');
//     }
//   };

//   return (
//     <div className="auth-wrapper">
//       <div className={`auth-container ${view}`}>
//         <div className="auth-image">
//           <img src={view === 'login' ? '/login.jpg' : '/sign up.jpg'} alt="Auth Visual" />
//         </div>
//         <div className="auth-form">
//           {view === 'login' && (
//             <>
//               <h2>Login</h2>
//               {isValidating && <p>Validating session...</p>}
//               {error && <p className="error-message">{error}</p>}
//               {loading && <p className="loading-message">Loading...</p>}
//               <form onSubmit={handleSubmit}>
//                 <div className="input-icon">
//                   <FaEnvelope style={{ marginRight: '8px' }} />
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>
//                 <div className="input-icon">
//                   <FaLock style={{ marginRight: '8px' }} />
//                   <input
//                     type="password"
//                     name="password"
//                     placeholder="Password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>
//                 <button type="submit" disabled={loading || isValidating}>
//                   Login
//                 </button>
//               </form>
//               <div className="auth-links">
//                 <p className="forgot-password" onClick={() => setView('forgot')}>
//                   Forgot Password?
//                 </p>
//                 <p className="create-account" onClick={toggleForm}>
//                   Create an account
//                 </p>
//               </div>
//             </>
//           )}
//           {view === 'signup' && (
//             <>
//               <h2>Sign Up</h2>
//               {error && <p className="error-message">{error}</p>}
//               {loading && <p className="loading-message">Loading...</p>}
//               <form onSubmit={handleSubmit}>
//                 <div className="input-icon">
//                   <FaUser style={{ marginRight: '8px' }} />
//                   <input
//                     type="text"
//                     name="username"
//                     placeholder="Username"
//                     value={formData.username}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>
//                 <div className="input-icon">
//                   <FaEnvelope style={{ marginRight: '8px' }} />
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>
//                 <div className="input-icon">
//                   <FaLock style={{ marginRight: '8px' }} />
//                   <input
//                     type="password"
//                     name="password"
//                     placeholder="Password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>
//                 <div className="input-icon">
//                   <select name="roleId" value={formData.roleId} onChange={handleChange} required>
//                     <option value="">Select Role</option>
//                     <option value="3BBB0200-87A6-4CE7-BC99-C2D7055627F5">Admin</option>
//                     <option value="1E09BBAE-44EE-469F-BCF4-15B22BBD4F83">Employee</option>
//                     <option value="33333333-3333-3333-3333-333333333333">Manager</option>
//                   </select>
//                 </div>
//                 <button type="submit" disabled={loading || isValidating}>
//                   Sign Up
//                 </button>
//               </form>
//               <div className="auth-links">
//                 <p className="create-account" onClick={toggleForm}>
//                   Already have an account? Login
//                 </p>
//               </div>
//             </>
//           )}
//           {view === 'forgot' && (
//             <>
//               <h2>Forgot Password</h2>
//               {error && <p className="error-message">{error}</p>}
//               {loading && <p className="loading-message">Loading...</p>}
//               <form onSubmit={handleForgotSubmit}>
//                 <div className="input-icon">
//                   <FaEnvelope style={{ marginRight: '8px' }} />
//                   <input
//                     type="email"
//                     placeholder="Enter your email"
//                     value={forgotEmail}
//                     onChange={handleForgotChange}
//                     required
//                   />
//                 </div>
//                 <button type="submit" disabled={loading}>
//                   Send Reset Link
//                 </button>
//                 <button type="button" onClick={() => setView('login')}>
//                   Cancel
//                 </button>
//               </form>
//               {forgotMessage && <p className="forgot-message">{forgotMessage}</p>}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;