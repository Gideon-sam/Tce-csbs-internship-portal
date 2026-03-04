import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './Auth.css';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await API.post('/auth/forgot-password', { email });
            setSuccess(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await API.post('/auth/verify-otp', { email, otp });
            setSuccess(res.data.message);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const res = await API.post('/auth/reset-password', { email, otp, newPassword });
            setSuccess(res.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Reset Password</h2>

                {/* Progress Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: step >= 1 ? '#830000' : '#ddd',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>1</div>
                    <div style={{ width: '40px', height: '2px', background: step >= 2 ? '#830000' : '#ddd', alignSelf: 'center' }}></div>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: step >= 2 ? '#830000' : '#ddd',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>2</div>
                    <div style={{ width: '40px', height: '2px', background: step >= 3 ? '#830000' : '#ddd', alignSelf: 'center' }}></div>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: step >= 3 ? '#830000' : '#ddd',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>3</div>
                </div>

                {error && (
                    <motion.div
                        className="error-msg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        style={{
                            background: '#d4edda',
                            color: '#155724',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            border: '1px solid #c3e6cb'
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {success}
                    </motion.div>
                )}

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            Enter your email address and we'll send you an OTP to reset your password.
                        </p>
                        <div className="form-group">
                            <label><Mail size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@student.tce.edu"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            Enter the 6-digit OTP sent to <strong>{email}</strong>
                        </p>
                        <div className="form-group">
                            <label><KeyRound size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength="6"
                                style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginTop: '10px',
                                background: 'transparent',
                                color: '#830000',
                                border: '1px solid #830000',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Resend OTP
                        </button>
                    </form>
                )}

                {/* Step 3: Set New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            Create a new password for your account
                        </p>
                        <div className="form-group">
                            <label><Lock size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
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
                        <div className="form-group">
                            <label><Lock size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="auth-link">
                    Remember your password? <a href="/login">Login</a>
                </p>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
