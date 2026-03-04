import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const ProctorDashboard = () => {
    const [internships, setInternships] = useState([]);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedHistory, setExpandedHistory] = useState({}); // Track which student histories are expanded

    useEffect(() => {
        fetchAssignedInternships();
    }, []);

    const fetchAssignedInternships = async () => {
        try {
            const res = await API.get('/internships/assigned');
            setInternships(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (status === 'Approved') {
            if (!window.confirm('Are you sure you want to approve this internship? This will add credits to the student.')) {
                return;
            }
        }

        if (status === 'Rejected' && !rejectionReason) {
            setSelectedId(id);
            return;
        }

        try {
            await API.put(`/internships/${id}/status`, { status, rejectionReason });
            setRejectionReason('');
            setSelectedId(null);
            fetchAssignedInternships();
        } catch (err) {
            alert('Update failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const toggleHistory = (internshipId) => {
        setExpandedHistory(prev => ({
            ...prev,
            [internshipId]: !prev[internshipId]
        }));
    };

    if (loading) return <div className="dashboard-container"><p>Loading assignments...</p></div>;

    return (
        <div className="dashboard-container">
            <h2 style={{ color: '#830000', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Proctor Dashboard</h2>

            <div className="list-card">
                <h3 style={{ marginTop: 0 }}>Assigned Internships</h3>
                {internships.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No internships assigned to you yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {internships.map(intern => (
                            <div key={intern._id} className="internship-item" style={{
                                border: '1px solid #ddd',
                                padding: '20px',
                                borderRadius: '8px',
                                background: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#333' }}>{intern.studentId?.name}</h4>
                                        <p style={{ margin: 0, color: '#666' }}>
                                            Reg No: <strong>{intern.studentId?.registerNo}</strong> |
                                            Year: {intern.studentId?.year} |
                                            Credits: <strong style={{ color: '#830000' }}>{intern.studentId?.credits || 0}</strong>
                                        </p>
                                    </div>
                                    <span className={`status-${intern.status.toLowerCase()}`} style={{
                                        padding: '5px 10px',
                                        borderRadius: '15px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        background: intern.status === 'Pending' ? '#fff3e0' : intern.status === 'Approved' ? '#e8f5e9' : '#ffebee',
                                        color: intern.status === 'Pending' ? '#ef6c00' : intern.status === 'Approved' ? '#2e7d32' : '#c62828'
                                    }}>
                                        {intern.status}
                                    </span>
                                </div>

                                {/* Current Submission Details */}
                                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#830000' }}> Current Submission</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <p style={{ margin: '5px 0' }}><strong>Company:</strong> {intern.companyName}</p>
                                            <p style={{ margin: '5px 0' }}><strong>Mode:</strong> {intern.mode}</p>
                                            <p style={{ margin: '5px 0' }}><strong>Duration:</strong> {new Date(intern.durationFrom).toLocaleDateString()} - {new Date(intern.durationTo).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: '5px 0' }}><strong>Description:</strong></p>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#555', background: '#fff', padding: '10px', borderRadius: '4px' }}>{intern.description}</p>
                                        </div>
                                    </div>

                                    <div className="file-links" style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                                        <a href={intern.certificateFilePath} target="_blank" rel="noopener noreferrer" className="file-link"> Certificate</a>
                                        {intern.pptFilePath && <a href={intern.pptFilePath} target="_blank" rel="noopener noreferrer" className="file-link"> PPT</a>}
                                        {intern.reportFilePath && <a href={intern.reportFilePath} target="_blank" rel="noopener noreferrer" className="file-link"> Report</a>}
                                        {intern.photoFilePath && <a href={intern.photoFilePath} target="_blank" rel="noopener noreferrer" className="file-link"> Photo</a>}
                                    </div>
                                </div>

                                {/* Student Internship History */}
                                {intern.studentHistory && intern.studentHistory.length > 0 && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <button
                                            onClick={() => toggleHistory(intern._id)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: '#830000',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.95rem',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {expandedHistory[intern._id] ? '▼' : '▶'}
                                            {expandedHistory[intern._id] ? 'Hide' : 'View'} Student's Complete History ({intern.studentHistory.length} total internship{intern.studentHistory.length !== 1 ? 's' : ''})
                                        </button>

                                        {expandedHistory[intern._id] && (
                                            <div style={{
                                                marginTop: '15px',
                                                padding: '15px',
                                                background: '#f0f0f0',
                                                borderRadius: '8px',
                                                border: '2px solid #830000'
                                            }}>
                                                <h5 style={{ margin: '0 0 15px 0', color: '#830000' }}>All Internship Submissions</h5>
                                                <div style={{ display: 'grid', gap: '15px' }}>
                                                    {intern.studentHistory.map((history, index) => (
                                                        <div key={history._id} style={{
                                                            background: history._id === intern._id ? '#fff9e6' : '#fff',
                                                            padding: '15px',
                                                            borderRadius: '6px',
                                                            border: history._id === intern._id ? '2px solid #ffa000' : '1px solid #ddd'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                <div>
                                                                    <strong style={{ fontSize: '1rem' }}>
                                                                        {history._id === intern._id ? ' Current Submission' : `Submission #${intern.studentHistory.length - index}`}
                                                                    </strong>
                                                                    <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#666' }}>
                                                                        {new Date(history.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold',
                                                                    background: history.status === 'Pending' ? '#fff3e0' : history.status === 'Approved' ? '#e8f5e9' : '#ffebee',
                                                                    color: history.status === 'Pending' ? '#ef6c00' : history.status === 'Approved' ? '#2e7d32' : '#c62828'
                                                                }}>
                                                                    {history.status}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                                                <div>
                                                                    <p style={{ margin: '3px 0' }}><strong>Company:</strong> {history.companyName}</p>
                                                                    <p style={{ margin: '3px 0' }}><strong>Mode:</strong> {history.mode}</p>
                                                                </div>
                                                                <div>
                                                                    <p style={{ margin: '3px 0' }}><strong>Duration:</strong></p>
                                                                    <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                                                                        {new Date(history.durationFrom).toLocaleDateString()} - {new Date(history.durationTo).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {history.description && (
                                                                <div style={{ marginTop: '10px' }}>
                                                                    <p style={{ margin: '3px 0' }}><strong>Description:</strong></p>
                                                                    <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#555', background: '#fff', padding: '8px', borderRadius: '4px' }}>
                                                                        {history.description}uu87u
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {history.rejectionReason && (
                                                                <div style={{ marginTop: '10px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
                                                                    <strong style={{ color: '#c62828' }}>Rejection Reason:</strong>
                                                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>{history.rejectionReason}</p>
                                                                </div>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                                                <a href={history.certificateFilePath} target="_blank" rel="noopener noreferrer"
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#830000', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                                    Certificate
                                                                </a>
                                                                {history.pptFilePath && (
                                                                    <a href={history.pptFilePath} target="_blank" rel="noopener noreferrer"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                                        PPT
                                                                    </a>
                                                                )}
                                                                {history.reportFilePath && (
                                                                    <a href={history.reportFilePath} target="_blank" rel="noopener noreferrer"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#388e3c', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                                        Report
                                                                    </a>
                                                                )}
                                                                {history.photoFilePath && (
                                                                    <a href={history.photoFilePath} target="_blank" rel="noopener noreferrer"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#f57c00', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                                        Photo
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {intern.status === 'Pending' && (
                                    <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            onClick={() => handleStatusUpdate(intern._id, 'Approved')}
                                            className="approve-btn"
                                            style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(intern._id, 'Rejected')}
                                            className="reject-btn"
                                            style={{ background: '#c62828', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {selectedId === intern._id && (
                                    <div className="rejection-input" style={{ marginTop: '15px', background: '#ffebee', padding: '15px', borderRadius: '8px' }}>
                                        <p style={{ margin: '0 0 10px 0', color: '#c62828', fontWeight: 'bold' }}>Reason for Rejection:</p>
                                        <textarea
                                            placeholder="Enter reason..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ef9a9a' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(intern._id, 'Rejected')}
                                                style={{ background: '#c62828', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Confirm Reject
                                            </button>
                                            <button
                                                onClick={() => { setSelectedId(null); setRejectionReason(''); }}
                                                style={{ background: '#666', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProctorDashboard;
