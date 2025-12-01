import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [internships, setInternships] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        description: '',
        mode: 'Online',
        durationFrom: '',
        durationTo: '',
        certificate: null,
        ppt: null,
        report: null,
        photo: null
    });
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Refs for file inputs to reset them after submission
    const certificateRef = useRef(null);
    const pptRef = useRef(null);
    const reportRef = useRef(null);
    const photoRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchInternships(),
                fetchCredits(),
                checkCreditAlert()
            ]);
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchInternships = async () => {
        try {
            const res = await API.get('/internships/my-internships');
            setInternships(res.data);
        } catch (err) {
            console.error('Error fetching internships:', err);
            setError('Failed to load internships');
        }
    };

    const fetchCredits = async () => {
        try {
            const res = await API.get('/student/credits');
            setCredits(res.data.credits);
        } catch (err) {
            console.error('Error fetching credits:', err);
        }
    };

    const checkCreditAlert = async () => {
        try {
            await API.post('/student/check-credits');
        } catch (err) {
            console.error('Error checking credits:', err);
        }
    };

    const handleChange = (e) => {
        setError('');
        setSuccess('');
        if (['certificate', 'ppt', 'report', 'photo'].includes(e.target.name)) {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                data.append(key, formData[key]);
            }
        });

        try {
            await API.post('/internships/submit', data);
            setSuccess('Internship submitted successfully! You will receive a confirmation email.');

            // Reset form
            setFormData({
                companyName: '',
                description: '',
                mode: 'Online',
                durationFrom: '',
                durationTo: '',
                certificate: null,
                ppt: null,
                report: null,
                photo: null
            });

            // Reset file inputs
            if (certificateRef.current) certificateRef.current.value = '';
            if (pptRef.current) pptRef.current.value = '';
            if (reportRef.current) reportRef.current.value = '';
            if (photoRef.current) photoRef.current.value = '';

            // Refresh data
            await fetchInternships();
            await fetchCredits();
            setShowForm(false); // Close form on success
        } catch (err) {
            setError('Submission failed: ' + (err.response?.data?.message || err.message));
            console.error('Submission error:', err);
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="dashboard-container">
                <h2>Student Dashboard</h2>
                <p>Loading your data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* Simplified Welcome Section */}
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <h1 style={{ color: '#333', margin: '0 0 10px 0' }}>Welcome, {user?.name || 'Student'}</h1>
                <p style={{ color: '#666', margin: 0 }}>Manage your internships and track your credits.</p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <div className="info-pill">
                        <span className="label">Reg No:</span>
                        <span className="value">{user?.registerNo || 'N/A'}</span>
                    </div>
                    <div className="info-pill">
                        <span className="label">Year:</span>
                        <span className="value">{user?.year || 'N/A'}</span>
                    </div>
                    <div className="info-pill">
                        <span className="label">Credits:</span>
                        <span className="value" style={{ color: credits >= 3 ? '#4caf50' : '#e65100' }}>{credits} / 3</span>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                    ✅ {success}
                </div>
            )}
            {error && (
                <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                    ❌ {error}
                </div>
            )}

            {/* Main Action Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: '#830000' }}>My Internships</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? '#666' : '#830000',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {showForm ? '✖ Cancel' : '➕ Submit Internship Details'}
                </button>
            </div>

            {/* Submission Form (Collapsible) */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '30px' }}
                    >
                        <div className="form-card" style={{ background: '#f9f9f9', border: '1px solid #ddd', boxShadow: 'none' }}>
                            <h3 style={{ marginTop: 0, color: '#333' }}>New Internship Submission</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="e.g., Google, Microsoft" />
                                </div>
                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Describe your role..." />
                                </div>
                                <div className="form-group">
                                    <label>Mode *</label>
                                    <select name="mode" value={formData.mode} onChange={handleChange}>
                                        <option value="Online">🌐 Online</option>
                                        <option value="Offline">🏢 Offline</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>From Date *</label>
                                        <input type="date" name="durationFrom" value={formData.durationFrom} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>To Date *</label>
                                        <input type="date" name="durationTo" value={formData.durationTo} onChange={handleChange} required />
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Upload Documents</h4>
                                <div className="form-group">
                                    <label>Certificate (PDF/Image) *</label>
                                    <input type="file" name="certificate" ref={certificateRef} onChange={handleChange} required accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <div className="form-group">
                                    <label>Presentation (PPT/PPTX)</label>
                                    <input type="file" name="ppt" ref={pptRef} onChange={handleChange} accept=".ppt,.pptx" />
                                </div>
                                <div className="form-group">
                                    <label>Report (PDF)</label>
                                    <input type="file" name="report" ref={reportRef} onChange={handleChange} accept=".pdf" />
                                </div>
                                <div className="form-group">
                                    <label>Photo Proof (Image)</label>
                                    <input type="file" name="photo" ref={photoRef} onChange={handleChange} accept=".jpg,.jpeg,.png" />
                                </div>

                                <button type="submit" className="submit-btn" disabled={submitting} style={{
                                    background: submitting ? '#ccc' : '#d32f2f',
                                    width: '100%',
                                    marginTop: '20px'
                                }}>
                                    {submitting ? '⏳ Submitting...' : 'Submit Internship'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submissions List */}
            <div className="submissions-list">
                {internships.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                        <p style={{ fontSize: '2rem', margin: 0 }}>📭</p>
                        <p>No internships submitted yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {internships.map(intern => (
                            <div key={intern._id} className="internship-card-item" style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{intern.companyName}</h3>
                                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(intern.durationFrom).toLocaleDateString()} - {new Date(intern.durationTo).toLocaleDateString()} • {intern.mode}
                                    </p>
                                    {intern.status === 'Rejected' && (
                                        <p style={{ color: '#d32f2f', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                            Reason: {intern.rejectionReason}
                                        </p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`status-badge ${intern.status.toLowerCase()}`} style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        background: intern.status === 'Approved' ? '#e8f5e9' : intern.status === 'Rejected' ? '#ffebee' : '#fff3e0',
                                        color: intern.status === 'Approved' ? '#2e7d32' : intern.status === 'Rejected' ? '#c62828' : '#ef6c00',
                                        border: `1px solid ${intern.status === 'Approved' ? '#a5d6a7' : intern.status === 'Rejected' ? '#ef9a9a' : '#ffe0b2'}`
                                    }}>
                                        {intern.status === 'Pending' ? '⏳ Pending Approval' : intern.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
