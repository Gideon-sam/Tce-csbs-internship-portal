import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import tceLogo from '../assets/tce_logo_contact.png';

import { motion } from 'framer-motion';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const res = await API.get('/internships/approved');
                setInternships(res.data);
            } catch (error) {
                console.error('Error fetching internships:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInternships();
    }, []);

    // Group internships by student
    const groupedByStudent = internships.reduce((acc, internship) => {
        const studentId = internship.studentId?._id;
        if (!studentId) return acc;
        if (!acc[studentId]) {
            acc[studentId] = {
                student: internship.studentId,
                internships: []
            };
        }
        acc[studentId].internships.push(internship);
        return acc;
    }, {});

    const [expandedStudentId, setExpandedStudentId] = useState(null);

    const toggleExpand = (studentId) => {
        setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
    };

    return (
        <div className="home-container">
            <motion.header
                className="hero-section"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800' }}>Department of Computer Science and Business Systems</h1>
                <p style={{ fontSize: '1.4rem', fontWeight: '500', opacity: '0.95' }}>Thiagarajar College of Engineering</p>
                <div style={{ width: '60px', height: '4px', background: '#fff', margin: '20px auto', borderRadius: '2px' }}></div>
                <p style={{ marginTop: '20px', fontSize: '1.1rem', maxWidth: '800px', margin: '20px auto', lineHeight: '1.6' }}>
                    Welcome to the Internship Management Portal. This platform facilitates the seamless submission, verification, and approval of student internships.
                    Track your progress and view approved internships from your peers.
                </p>
            </motion.header>

            <motion.section
                className="approved-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                <h2>Completed Internships</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : Object.keys(groupedByStudent).length === 0 ? (
                    <p className="no-data">No approved internships to display yet.</p>
                ) : (
                    <>
                        {['1st', '2nd', '3rd', '4th'].map((year) => {
                            // Filter students by year
                            const yearStudents = Object.values(groupedByStudent).filter(
                                ({ student }) => student.year === year
                            );

                            if (yearStudents.length === 0) return null;

                            return (
                                <div key={year} className="year-section">
                                    <h3 className="year-heading">{year} Year</h3>
                                    <div className="table-responsive">
                                        <table className="internship-table">
                                            <thead>
                                                <tr>
                                                    <th>Register No</th>
                                                    <th>Student Name</th>
                                                    <th>Department</th>
                                                    <th>Year</th>
                                                    <th>Internships</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yearStudents.map(({ student, internships }) => (
                                                    <React.Fragment key={student._id}>
                                                        <tr className={`student-row ${expandedStudentId === student._id ? 'expanded' : ''}`} onClick={() => toggleExpand(student._id)}>
                                                            <td>{student.registerNo}</td>
                                                            <td>{student.name}</td>
                                                            <td>{student.department}</td>
                                                            <td>{student.year}</td>
                                                            <td><span className="badge">{internships.length} Approved</span></td>
                                                            <td>
                                                                <button className="expand-btn">
                                                                    {expandedStudentId === student._id ? 'Hide Details' : 'View Details'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {expandedStudentId === student._id && (
                                                            <tr className="details-row">
                                                                <td colSpan="6">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="details-container"
                                                                    >
                                                                        <h4>Internship Details</h4>
                                                                        <div className="details-grid">
                                                                            {internships.map(intern => (
                                                                                <div key={intern._id} className="detail-card">
                                                                                    <h5>{intern.companyName}</h5>
                                                                                    <p><strong>Mode:</strong> {intern.mode}</p>
                                                                                    <p><strong>Duration:</strong> {new Date(intern.durationFrom).toLocaleDateString()} - {new Date(intern.durationTo).toLocaleDateString()}</p>
                                                                                    <p className="description">{intern.description}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </motion.section>

            {/* Contact Information */}
            <motion.section
                className="contact-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{
                    background: 'white',
                    padding: '40px 20px',
                    borderRadius: '12px',
                    marginTop: '40px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
            >
                <h2 style={{ color: '#830000', marginBottom: '20px' }}>Contact Information</h2>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <img src={tceLogo} alt="TCE Logo" style={{ width: '120px', marginBottom: '15px' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>Thiagarajar College of Engineering</p>
                    <p>Madurai - 625 015</p>
                    <p>Tamil Nadu, India</p>
                    <p style={{ marginTop: '15px' }}>📞 <strong>+91 452 2482240</strong></p>
                    <p>🌐 <a href="http://www.tce.edu" target="_blank" rel="noopener noreferrer" style={{ color: '#830000', textDecoration: 'none' }}>www.tce.edu</a></p>
                </div>
            </motion.section>
        </div>
    );
};

export default Home;
