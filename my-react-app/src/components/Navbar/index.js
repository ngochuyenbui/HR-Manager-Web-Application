import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function HRNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const location = useLocation();
  const current = location.pathname || '/';

  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('isAuthenticated')));

  useEffect(() => {
    const onAuthChange = () => setIsAuthenticated(Boolean(localStorage.getItem('isAuthenticated')));
    window.addEventListener('authChange', onAuthChange);
    // also update on location change (in case login sets storage without dispatch)
    onAuthChange();
    return () => window.removeEventListener('authChange', onAuthChange);
  }, [location.pathname]);

  const linkColor = (path) => (current === path ? '#fc6544' : '#a8a8a8ff');

  return (
    <nav style={{
      backgroundColor: '#06007c',
      padding: '0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #ccc',
      position: 'relative',
      height: '50px',
      minHeight: '50px',
      maxHeight: '50px',
      overflow: 'visible',
      boxSizing: 'border-box'
    }}>
      {/* Main Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '50px',
        padding: '0 1rem',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Left side: Brand */}
         {isMobile && isAuthenticated && (
          <div style={{ marginLeft: '0.5rem', zIndex: 20 }}>
            <button
              onClick={toggleMenu}
              aria-label="Open menu"
              style={{
                background: 'none',
                border: '2px solid #fc6544',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                color: '#fc6544',
                borderRadius: '4px'
              }}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          // Center the logo when not authenticated on desktop; otherwise position to left.
          position: isMobile ? 'relative' : 'absolute',
          left: isMobile ? '0.5rem' : (isAuthenticated ? '1rem' : '50%'),
          transform: (!isMobile && !isAuthenticated) ? 'translateX(-50%)' : undefined,
          zIndex: 10
        }}>
          {/* Brand / Logo and Text Container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {/* Logo */}
            <div style={{
              height: '45px',
              width: '45px',            
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img 
                src="/idCu14vzRC_logos-removebg-preview.png" 
                alt="HRManagement Logo" 
                style={{ 
                  maxHeight: isMobile ? '40px' : '70px',
                  maxWidth: isMobile ? '40px' : '70px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }} 
              />
            </div>
            {/* Text */}
            <h2 style={{ 
              margin: 0, 
              color: '#ffffff', 
              fontSize: isMobile ? '1.6rem' : '1.8rem',
              fontWeight: '700',
              fontFamily: 'Baloo 2, sans-serif',
              letterSpacing: '-0.5px'
            }}>
              HRManagement
            </h2>
          </div>          
        </div>
        {/* Mobile hamburger placed inside left brand container so it's on the left side */}
       
        
        {/* Center: Desktop Menu */}
        {!isMobile && isAuthenticated && (
          <div style={{ 
            display: 'flex',
            gap: '3.5rem', 
            alignItems: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <Link to="/dashboard" style={{ 
              textDecoration: 'none', 
              color: linkColor('/dashboard'), 
              fontSize: '1rem', 
              fontWeight: '650',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Dashboard
            </Link>
            {/* Login moved to right-side as a button on desktop */}
            <a href="/employeemanagement" style={{ 
              textDecoration: 'none', 
              color: linkColor('/employeemanagement'), 
              fontSize: '1rem', 
              fontWeight: '650',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Employees Management
            </a>
            <Link to="/timetracking" style={{ 
              textDecoration: 'none', 
              color: linkColor('/timetracking'), 
              fontSize: '1rem', 
              fontWeight: '650',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Time Tracking
            </Link>
            <Link to="/contract" style={{ 
              textDecoration: 'none', 
              color: linkColor('/contract'), 
              fontSize: '1rem', 
              fontWeight: '650',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Contract
            </Link>
            <a href="/payroll" style={{ 
              textDecoration: 'none', 
              color: '#a8a8a8ff', 
              fontSize: '1rem', 
              fontWeight: '650',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Payroll
            </a>
          </div>
        )}
        
  {/* Right side: Button and Mobile Menu (hidden on mobile) */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    position: isMobile ? 'relative' : 'absolute',
    right: isMobile ? '0.5rem' : '1rem',
    top: 0,
    height: '50px',
    zIndex: 20
  }}>
          {/* Desktop Button - Hidden on mobile */}
          {!isAuthenticated && (
            <Link to="/login" style={{
              textDecoration: 'none',
              display: 'inline-block',
              backgroundColor: '#21078cff',
              color: '#ffffff',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: '2px solid #fc6544',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              fontFamily: 'Baloo 2, sans-serif',
              marginLeft: '0.75rem'
            }}>
              Login
            </Link>
          )}
          {!isMobile && isAuthenticated && (
              <button type="button" onClick={() => { localStorage.removeItem('isAuthenticated'); setIsAuthenticated(false); navigate('/login'); }} style={{
                backgroundColor: '#ffffff',
              color: '#21078cff',
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              border: '2px solid #fc6544',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              fontFamily: 'Baloo 2, sans-serif',
              marginLeft: '0.75rem'
              }}>
                Logout
              </button>
          )}
          
          {/* Desktop-only button (hidden on mobile) - kept for symmetry if needed */}
          {/* Hide the hamburger on desktop: only show mobile hamburger (left side) */}
          <button 
            onClick={toggleMenu}
            style={{ 
              background: 'none',
              border: '2px solid #fc6544',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#fc6544',
              borderRadius: '4px',
              display: 'none' // ensure no hamburger appears on desktop
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - Show when menu is open */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',              // Position right below navbar
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '1rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          zIndex: 9999,
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '200px'        // Add minimum height to ensure visibility
        }}>
          <Link to="/dashboard" style={{ 
            textDecoration: 'none', 
            color: linkColor('/dashboard'), 
            fontSize: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #f3f4f6',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            Dashboard
          </Link>
          {!isAuthenticated && (
            <Link to="/login" style={{ 
              textDecoration: 'none', 
              color: '#374151', 
              fontSize: '1rem',
              padding: '1rem 0',
              borderBottom: '1px solid #f3f4f6',
              fontFamily: 'Baloo 2, sans-serif'
            }}>
              Login
            </Link>
          )}
          
          <Link to="/employeemanagement" style={{ 
            textDecoration: 'none', 
            color: linkColor('/employeemanagement'), 
            fontSize: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #f3f4f6',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            Employees Management
          </Link>
          <Link to="/timetracking" style={{ 
            textDecoration: 'none', 
            color: linkColor('/timetracking'), 
            fontSize: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #f3f4f6',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            Time Tracking
          </Link>
          <Link to="/contract" style={{ 
            textDecoration: 'none', 
            color: linkColor('/contract'), 
            fontSize: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #f3f4f6',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            Contract
          </Link>
          <a href="/payroll" style={{ 
            textDecoration: 'none', 
            color: '#374151', 
            fontSize: '1rem',
            padding: '1rem 0',
            borderBottom: '1px solid #f3f4f6',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            Payroll
          </a>
          {isAuthenticated && (
            <button type="button" onClick={() => { localStorage.removeItem('isAuthenticated'); setIsAuthenticated(false); navigate('/login'); }} style={{
              backgroundColor: '#ffffff',
              color: '#21078cff',
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              border: '2px solid #fc6544',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              fontFamily: 'Baloo 2, sans-serif',
              marginLeft: '0.75rem'
            }}>
              Logout
            </button>
          )}
          {/* <button style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            marginTop: '1rem',
            marginBottom: '0.5rem',
            fontFamily: 'Baloo 2, sans-serif'
          }}>
            GET STARTED
          </button> */}
        </div>
      )}
    </nav>
  );
}