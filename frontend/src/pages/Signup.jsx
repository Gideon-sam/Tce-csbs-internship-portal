import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './Auth.css';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        registerNo: '',
        department: '',
        year: '1st'
    });
    const [googleData, setGoogleData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (googleData) {
                // Complete Google registration
                await API.post('/auth/google/complete', {
                    ...formData,
                    googleId: googleData.googleId,
                    name: googleData.name,
                    email: googleData.email
                });
            } else {
                // Regular registration
                await API.post('/auth/student/register', formData);
            }
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const res = await API.post('/auth/google', {
                credential: credentialResponse.credential,
                role: 'student'
            });

            // If status is 206, need additional info
            if (res.status === 206) {
                setGoogleData(res.data.partialUser);
                setFormData({
                    ...formData,
                    name: res.data.partialUser.name,
                    email: res.data.partialUser.email
                });
            } else {
                // User already exists, redirect to dashboard
                alert('Account already exists! Logging you in...');
                navigate('/student/dashboard');
            }
        } catch (err) {
            if (err.response?.status === 206) {
                // Need additional info
                setGoogleData(err.response.data.partialUser);
                setFormData({
                    ...formData,
                    name: err.response.data.partialUser.name,
                    email: err.response.data.partialUser.email
                });
            } else {
                setError(err.response?.data?.message || 'Google signup failed. Please try again.');
            }
        }
    };

    const handleGoogleError = () => {
        setError('Google signup failed. Please try again.');
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Student Signup</h2>
                {error && (
                    <motion.div
                        className="error-msg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* Show Google OAuth only if not in completion mode */}
                {!googleData && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="outline"
                                size="large"
                                text="signup_with"
                                shape="rectangular"
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '20px 0',
                            gap: '10px'
                        }}>
                            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                            <span style={{ color: '#666', fontSize: '14px' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                        </div>
                    </>
                )}

                {googleData && (
                    <div style={{
                        background: '#e8f5e9',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontSize: '14px',
                        color: '#2e7d32'
                    }}>
                        ✓ Google account connected. Please complete your registration below.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            readOnly={googleData}
                            style={googleData ? { background: '#f5f5f5' } : {}}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            readOnly={googleData}
                            style={googleData ? { background: '#f5f5f5' } : {}}
                        />
                    </div>
                    {!googleData && (
                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    onChange={handleChange}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#666'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Register Number</label>
                        <input type="text" name="registerNo" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Department</label>
                        <input type="text" name="department" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Year</label>
                        <select name="year" onChange={handleChange}>
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                        </select>
                    </div>
                    <button type="submit" className="auth-btn">
                        {googleData ? 'Complete Registration' : 'Sign Up'}
                    </button>
                </form>
                <p className="auth-link">Already have an account? <a href="/login">Login</a></p>
            </motion.div>
        </div>
    );
};

export default Signup;
