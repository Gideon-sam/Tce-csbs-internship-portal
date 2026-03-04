import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, Cell, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [internships, setInternships] = useState([]);
    const [filteredInternships, setFilteredInternships] = useState([]);
    const [lowCreditStudents, setLowCreditStudents] = useState([]);
    const [proctors, setProctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alerting, setAlerting] = useState(false);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [modeFilter, setModeFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [creditsFilter, setCreditsFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // UI states
    const [activeTab, setActiveTab] = useState('overview'); // overview, internships, proctors
    const [expandedProctor, setExpandedProctor] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [internships, searchTerm, statusFilter, modeFilter, yearFilter, creditsFilter, sortBy, sortOrder]);

    const fetchData = async () => {
        try {
            // Fetch stats and internships (required)
            const [statsRes, internshipsRes] = await Promise.all([
                API.get('/admin/stats'),
                API.get('/admin/internships')
            ]);
            setStats(statsRes.data);
            setInternships(internshipsRes.data);
            setFilteredInternships(internshipsRes.data);

            // Debug: Log year-wise data
            console.log('Stats received:', statsRes.data);
            console.log('Year-wise internships:', statsRes.data.yearWiseInternships);

            // Fetch low credit students (optional)
            try {
                const lowCreditsRes = await API.get('/admin/low-credits');
                setLowCreditStudents(lowCreditsRes.data);
            } catch (err) {
                console.error('Error fetching low credit students:', err);
                setLowCreditStudents([]);
            }

            // Fetch proctors (optional)
            try {
                const proctorsRes = await API.get('/admin/proctors');
                setProctors(proctorsRes.data);
            } catch (err) {
                console.error('Error fetching proctors:', err);
                setProctors([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            alert('Error loading dashboard data. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...internships];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(intern =>
                intern.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.studentId?.registerNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(intern => intern.status === statusFilter);
        }

        // Mode filter
        if (modeFilter !== 'All') {
            filtered = filtered.filter(intern => intern.mode === modeFilter);
        }

        // Year filter
        if (yearFilter !== 'All') {
            filtered = filtered.filter(intern => intern.studentId?.year === yearFilter);
        }

        // Credits filter
        if (creditsFilter !== 'All') {
            if (creditsFilter === 'Low') {
                filtered = filtered.filter(intern => (intern.studentId?.credits || 0) < 3);
            } else if (creditsFilter === 'Completed') {
                filtered = filtered.filter(intern => (intern.studentId?.credits || 0) >= 3);
            }
        }

        // Sorting
        filtered.sort((a, b) => {
            let compareValue = 0;

            switch (sortBy) {
                case 'name':
                    compareValue = (a.studentId?.name || '').localeCompare(b.studentId?.name || '');
                    break;
                case 'date':
                    compareValue = new Date(b.createdAt) - new Date(a.createdAt);
                    break;
                case 'status':
                    compareValue = a.status.localeCompare(b.status);
                    break;
                case 'credits':
                    compareValue = (a.studentId?.credits || 0) - (b.studentId?.credits || 0);
                    break;
                default:
                    compareValue = 0;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredInternships(filtered);
    };

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

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('Internship Management Report', 14, 22);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Add statistics
        doc.setFontSize(14);
        doc.text('Statistics Overview', 14, 40);
        doc.setFontSize(10);
        doc.text(`Total Students: ${stats.totalStudents}`, 14, 48);
        doc.text(`Total Internships: ${stats.totalInternships}`, 14, 54);
        doc.text(`Pending: ${stats.pendingInternships}`, 14, 60);
        doc.text(`Approved: ${stats.approvedInternships}`, 14, 66);
        doc.text(`Rejected: ${stats.rejectedInternships}`, 14, 72);
        doc.text(`Average Duration: ${stats.averageDuration} days`, 14, 78);

        // Add internships table
        const tableData = filteredInternships.map(intern => [
            intern.studentId?.name || 'N/A',
            intern.studentId?.registerNo || 'N/A',
            intern.companyName || 'N/A',
            intern.mode || 'N/A',
            intern.status || 'N/A',
            intern.studentId?.year || 'N/A',
            intern.studentId?.credits || 0
        ]);

        doc.autoTable({
            startY: 85,
            head: [['Student', 'Reg No', 'Company', 'Mode', 'Status', 'Year', 'Credits']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [131, 0, 0] },
            styles: { fontSize: 8 }
        });

        doc.save('internship-report.pdf');
    };

    const toggleProctor = (proctorId) => {
        setExpandedProctor(expandedProctor === proctorId ? null : proctorId);
    };

    if (loading) return <div className="dashboard-container"><p>Loading admin data...</p></div>;

    // Provide default values if stats failed to load
    const safeStats = stats || {
        totalStudents: 0,
        totalInternships: 0,
        pendingInternships: 0,
        approvedInternships: 0,
        rejectedInternships: 0,
        studentsCompletedCredits: 0,
        studentsPendingCredits: 0,
        studentsWithInternships: 0,
        modeStats: { online: 0, offline: 0 },
        yearStats: [],
        yearWiseInternships: [],
        averageDuration: 0
    };

    const pieData = [
        { name: 'Online', value: safeStats.modeStats.online },
        { name: 'Offline', value: safeStats.modeStats.offline }
    ];
    const COLORS = ['#0088FE', '#00C49F'];

    // Prepare year-wise data for bar chart
    const yearWiseData = safeStats.yearWiseInternships?.map(item => ({
        year: item._id || 'Unknown',
        count: item.count
    })) || [];

    return (
        <div className="dashboard-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ color: '#830000', margin: 0 }}>Admin Dashboard</h2>
                <Link to="/" style={{ textDecoration: 'none', color: '#830000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Home
                </Link>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'overview' ? '#830000' : 'transparent',
                        color: activeTab === 'overview' ? 'white' : '#830000',
                        border: 'none',
                        borderBottom: activeTab === 'overview' ? '3px solid #830000' : '3px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Overview & Analytics
                </button>
                <button
                    onClick={() => setActiveTab('internships')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'internships' ? '#830000' : 'transparent',
                        color: activeTab === 'internships' ? 'white' : '#830000',
                        border: 'none',
                        borderBottom: activeTab === 'internships' ? '3px solid #830000' : '3px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    All Internships
                </button>
                <button
                    onClick={() => setActiveTab('proctors')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'proctors' ? '#830000' : 'transparent',
                        color: activeTab === 'proctors' ? 'white' : '#830000',
                        border: 'none',
                        borderBottom: activeTab === 'proctors' ? '3px solid #830000' : '3px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Proctor Management
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="stat-card" style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Total Students</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{safeStats.totalStudents}</p>
                        </div>
                        <div className="stat-card" style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#ef6c00' }}>Total Internships</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{safeStats.totalInternships}</p>
                        </div>
                        <div className="stat-card" style={{ background: '#fff8e1', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#fbc02d' }}>Pending</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{safeStats.pendingInternships}</p>
                        </div>
                        <div className="stat-card" style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Approved</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{safeStats.approvedInternships}</p>
                        </div>
                        <div className="stat-card" style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Avg Duration</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{safeStats.averageDuration} days</p>
                        </div>
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
                            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Year-wise Internship Distribution</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                {yearWiseData && yearWiseData.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart data={yearWiseData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="year" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#830000" name="Internships" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                                        <p>No year-wise data available. Ensure students have their year field set.</p>
                                    </div>
                                )}
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
                </>
            )}

            {/* Internships Tab */}
            {activeTab === 'internships' && (
                <>
                    {/* Search and Filter Controls */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Search & Filters</h3>

                        {/* Search Bar */}
                        <input
                            type="text"
                            placeholder="Search by student name, register number, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />

                        {/* Filter Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>

                            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="All">All Modes</option>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>

                            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="All">All Years</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>

                            <select value={creditsFilter} onChange={(e) => setCreditsFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="All">All Credits</option>
                                <option value="Low">Low (&lt; 3)</option>
                                <option value="Completed">Completed (≥ 3)</option>
                            </select>

                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="date">Sort by Date</option>
                                <option value="name">Sort by Name</option>
                                <option value="status">Sort by Status</option>
                                <option value="credits">Sort by Credits</option>
                            </select>

                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
                                    setModeFilter('All');
                                    setYearFilter('All');
                                    setCreditsFilter('All');
                                    setSortBy('date');
                                    setSortOrder('desc');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Filters
                            </button>
                            <div style={{ flex: 1 }}></div>
                            <button
                                onClick={exportToPDF}
                                style={{
                                    padding: '8px 16px',
                                    background: '#830000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                📄 Export to PDF
                            </button>
                            <button
                                onClick={() => {
                                    const allInternships = filteredInternships.flatMap(group =>
                                        group.studentHistory.map(history => ({
                                            name: group.studentId?.name,
                                            registerNo: group.studentId?.registerNo,
                                            company: history.companyName,
                                            mode: history.mode,
                                            status: history.status,
                                            durationFrom: history.durationFrom,
                                            durationTo: history.durationTo
                                        }))
                                    );

                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + "Student,RegisterNo,Company,Mode,Status,Duration From,Duration To\n"
                                        + allInternships.map(i => `${i.name},${i.registerNo},${i.company},${i.mode},${i.status},${new Date(i.durationFrom).toLocaleDateString()},${new Date(i.durationTo).toLocaleDateString()}`).join("\n");

                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "internships.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                📊 Export to CSV
                            </button>
                        </div>

                        <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                            Showing {filteredInternships.length} of {internships.length} internships
                        </p>
                    </div>

                    {/* Internships Table */}
                    <div className="list-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>All Internships</h3>
                        <div className="table-responsive" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#830000', color: 'white', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>Student</th>
                                        <th style={{ padding: '12px' }}>Company</th>
                                        <th style={{ padding: '12px' }}>Mode</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInternships.map(intern => (
                                        <InternshipRow key={intern._id} intern={intern} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Proctors Tab */}
            {activeTab === 'proctors' && (
                <div className="list-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Proctor Management</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>View all proctors and their assigned students</p>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        {proctors.map(proctor => (
                            <div key={proctor._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#f9f9f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#830000' }}>{proctor.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{proctor.email}</p>
                                        {proctor.department && <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#999' }}>Department: {proctor.department}</p>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>{proctor.studentCount}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Students</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>{proctor.internshipCount}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Internships</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef6c00' }}>{proctor.pendingCount}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Pending</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Separate component for expandable table rows
const InternshipRow = ({ intern }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr style={{ borderBottom: '1px solid #eee', background: expanded ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{intern.studentId?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{intern.studentId?.registerNo}</div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>Year: {intern.studentId?.year} | Credits: {intern.studentId?.credits || 0}</div>
                </td>
                <td style={{ padding: '12px' }}>{intern.companyName}</td>
                <td style={{ padding: '12px' }}>{intern.mode}</td>
                <td style={{ padding: '12px' }}>
                    <span style={{
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
                <td style={{ padding: '12px' }}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            background: '#830000',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {expanded ? '▼ Hide' : '▶ View'} Details ({intern.studentHistory.length})
                    </button>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan="5" style={{ padding: '0', background: '#f5f5f5' }}>
                        <div style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#830000' }}>Complete Internship History</h4>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {intern.studentHistory.map((history, index) => (
                                    <div key={history._id} style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '6px',
                                        border: history._id === intern._id ? '2px solid #830000' : '1px solid #ddd'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <strong style={{ color: history._id === intern._id ? '#830000' : '#333' }}>
                                                {history._id === intern._id ? '⭐ Latest' : `#${intern.studentHistory.length - index}`} - {history.companyName}
                                            </strong>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                background: history.status === 'Pending' ? '#fff3e0' : history.status === 'Approved' ? '#e8f5e9' : '#ffebee',
                                                color: history.status === 'Pending' ? '#ef6c00' : history.status === 'Approved' ? '#2e7d32' : '#c62828'
                                            }}>
                                                {history.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.9rem', marginBottom: '10px' }}>
                                            <div><strong>Mode:</strong> {history.mode}</div>
                                            <div><strong>Duration:</strong> {new Date(history.durationFrom).toLocaleDateString()} - {new Date(history.durationTo).toLocaleDateString()}</div>
                                            <div><strong>Submitted:</strong> {new Date(history.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        {history.description && (
                                            <div style={{ marginBottom: '10px' }}>
                                                <strong>Description:</strong>
                                                <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#555' }}>{history.description}</p>
                                            </div>
                                        )}
                                        {history.rejectionReason && (
                                            <div style={{ padding: '8px', background: '#ffebee', borderRadius: '4px', marginBottom: '10px' }}>
                                                <strong style={{ color: '#c62828' }}>Rejection Reason:</strong>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>{history.rejectionReason}</p>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <a href={history.certificateFilePath} target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#830000', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                📄 Certificate
                                            </a>
                                            {history.pptFilePath && (
                                                <a href={history.pptFilePath} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                    📊 PPT
                                                </a>
                                            )}
                                            {history.reportFilePath && (
                                                <a href={history.reportFilePath} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#388e3c', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                    📝 Report
                                                </a>
                                            )}
                                            {history.photoFilePath && (
                                                <a href={history.photoFilePath} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', padding: '5px 10px', background: '#f57c00', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                                    📷 Photo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default AdminDashboard;
