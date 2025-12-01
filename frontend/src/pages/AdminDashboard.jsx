import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [internships, setInternships] = useState([]);
    const [lowCreditStudents, setLowCreditStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alerting, setAlerting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, internshipsRes, lowCreditsRes] = await Promise.all([
                    API.get('/admin/stats'),
                    API.get('/admin/internships'),
                    API.get('/admin/low-credits')
                ]);
                setStats(statsRes.data);
                setInternships(internshipsRes.data);
                setLowCreditStudents(lowCreditsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSendAlerts = async () => {
        if (!window.confirm('Are you sure you want to send email alerts to all students with less than 3 credits?')) return;

        setAlerting(true);
        try {
            const res = await API.post('/admin/send-alerts');
            alert(`Alerts sent successfully!\nSent: ${res.data.sent}\nFailed: ${res.data.failed}`);
        } catch (error) {
            console.error('Error sending alerts:', error);
            alert('Failed to send alerts.');
        } finally {
            setAlerting(false);
        }
    };

    if (loading) return <div className="dashboard-container"><p>Loading admin data...</p></div>;
    if (!stats) return <div className="dashboard-container"><p>Error loading data.</p></div>;

    const pieData = [
        { name: 'Online', value: stats.modeStats.online },
        { name: 'Offline', value: stats.modeStats.offline }
    ];
    const COLORS = ['#0088FE', '#00C49F'];

    return (
        <div className="dashboard-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ color: '#830000', margin: 0 }}>Admin Dashboard</h2>
                <Link to="/" style={{ textDecoration: 'none', color: '#830000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🏠 Home
                </Link>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Total Students</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalStudents}</p>
                </div>
                <div className="stat-card" style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#ef6c00' }}>Total Internships</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalInternships}</p>
                </div>
                <div className="stat-card" style={{ background: '#fff8e1', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fbc02d' }}>Pending</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.pendingInternships}</p>
                </div>
                <div className="stat-card" style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Approved</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.approvedInternships}</p>
                </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + "Student,RegisterNo,Company,Mode,Status\n"
                        + internships.map(i => `${i.studentId?.name},${i.studentId?.registerNo},${i.companyName},${i.mode},${i.status}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "internships.csv");
                    document.body.appendChild(link);
                    link.click();
                }} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                    📥 Export to CSV
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Internship Mode Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Student Internship Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Total Students', value: stats.totalStudents },
                                        { name: 'With Internships', value: stats.studentsWithInternships },
                                        { name: 'Completed Credits', value: stats.studentsCompletedCredits }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#82ca9d"
                                    dataKey="value"
                                    label
                                >
                                    <Cell fill="#8884d8" />
                                    <Cell fill="#82ca9d" />
                                    <Cell fill="#ffc658" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="list-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#d32f2f' }}>Students with Low Credits (&lt; 3)</h3>
                    <button
                        onClick={handleSendAlerts}
                        disabled={alerting || lowCreditStudents.length === 0}
                        style={{
                            background: alerting ? '#ccc' : '#d32f2f',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: alerting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {alerting ? 'Sending...' : 'Send Email Alerts'}
                    </button>
                </div>

                {lowCreditStudents.length === 0 ? (
                    <p>All students have completed required credits.</p>
                ) : (
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                <tr style={{ background: '#ffebee', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>Register No</th>
                                    <th style={{ padding: '12px' }}>Year</th>
                                    <th style={{ padding: '12px' }}>Credits Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowCreditStudents.map(student => (
                                    <tr key={student._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{student.name}</td>
                                        <td style={{ padding: '12px' }}>{student.registerNo}</td>
                                        <td style={{ padding: '12px' }}>{student.year}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#d32f2f' }}>{student.credits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="list-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>All Internships</h3>
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Student</th>
                                <th style={{ padding: '12px' }}>Company</th>
                                <th style={{ padding: '12px' }}>Mode</th>
                                <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {internships.map(intern => (
                                <tr key={intern._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div>{intern.studentId?.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{intern.studentId?.registerNo}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>{intern.companyName}</td>
                                    <td style={{ padding: '12px' }}>{intern.mode}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-${intern.status.toLowerCase()}`} style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            background: intern.status === 'Approved' ? '#e8f5e9' : intern.status === 'Rejected' ? '#ffebee' : '#fff3e0',
                                            color: intern.status === 'Approved' ? '#2e7d32' : intern.status === 'Rejected' ? '#c62828' : '#ef6c00'
                                        }}>
                                            {intern.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
