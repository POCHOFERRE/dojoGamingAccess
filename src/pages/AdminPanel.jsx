import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FaChartLine, FaGamepad, FaUsers, FaCalendarAlt, FaCog, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import styled from 'styled-components';
import ConsoleManagement from '@/components/admin/ConsoleManagement';
import UserManagement from '@/components/admin/UserManagement';

// Styled Components
const AdminContainer = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-right: 1px solid var(--border-color);
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.main`
  padding: 2rem;
  overflow-y: auto;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.active ? 'var(--accent-color)' : 'var(--text-color)'};
  background: ${props => props.active ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent'};
  
  &:hover {
    background: rgba(var(--accent-rgb), 0.1);
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.1rem;
  }
`;

const SectionTitle = styled.h2`
  color: var(--text-color);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h3 {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  p {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    color: var(--accent-color);
  }
`;

// Admin Panel Component
const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    availableConsoles: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // TODO: Check if user has admin role
    // For now, just check if user is authenticated
    
    // Load initial stats
    loadStats();
  }, [currentUser, navigate]);

  const loadStats = async () => {
    try {
      // Example: Get total bookings
      const bookingsQuery = query(collection(db, 'bookings'));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Calculate total revenue
      let totalRevenue = 0;
      bookingsSnapshot.forEach(doc => {
        totalRevenue += doc.data().amount || 0;
      });
      
      // Update stats
      setStats({
        totalBookings: bookingsSnapshot.size,
        totalRevenue,
        activeUsers: 0, // TODO: Implement user count
        availableConsoles: 0 // TODO: Implement console count
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <SectionTitle>Panel de Control</SectionTitle>
            <StatsGrid>
              <StatCard>
                <h3>Reservas Totales</h3>
                <p>{stats.totalBookings}</p>
              </StatCard>
              <StatCard>
                <h3>Ingresos Totales</h3>
                <p>${stats.totalRevenue.toLocaleString()}</p>
              </StatCard>
              <StatCard>
                <h3>Usuarios Activos</h3>
                <p>{stats.activeUsers}</p>
              </StatCard>
              <StatCard>
                <h3>Consolas Disponibles</h3>
                <p>{stats.availableConsoles}</p>
              </StatCard>
            </StatsGrid>
            
            {/* Dashboard widgets */}
            <div style={{ marginTop: '2rem' }}>
              <h3>Actividad Reciente</h3>
              <p>Aquí irá el resumen de actividad reciente...</p>
            </div>
          </>
        );
      
      case 'consoles':
        return <ConsoleManagement />;
        
      case 'users':
        return <UserManagement />;
        
      case 'bookings':
        return (
          <div>
            <h2>Gestión de Reservas</h2>
            <p>Aquí irá el listado de reservas...</p>
          </div>
        );
        
      case 'settings':
        return (
          <div>
            <h2>Configuración</h2>
            <p>Aquí irán las opciones de configuración...</p>
          </div>
        );
      
      default:
        return (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FaTachometerAlt style={{ fontSize: '3rem', color: 'var(--accent-color)', marginBottom: '1rem' }} />
            <h2>Panel de Administración</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Seleccione una opción del menú para comenzar</p>
          </div>
        );
    }
  };

  return (
    <AdminContainer>
      <Sidebar>
        <div style={{ marginBottom: '2rem', padding: '0.5rem' }}>
          <h2>Admin Panel</h2>
        </div>
        
        <NavItem 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
        >
          <FaTachometerAlt />
          Dashboard
        </NavItem>
        
        <NavItem 
          active={activeTab === 'consoles'} 
          onClick={() => setActiveTab('consoles')}
        >
          <FaGamepad />
          Consolas
        </NavItem>
        
        <NavItem 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          <FaUsers />
          Usuarios
        </NavItem>
        
        <NavItem 
          active={activeTab === 'bookings'} 
          onClick={() => setActiveTab('bookings')}
        >
          <FaCalendarAlt />
          Reservas
        </NavItem>
        
        <div style={{ marginTop: 'auto', padding: '1rem 0' }}>
          <NavItem 
            onClick={logout}
            style={{ color: '#e74c3c' }}
          >
            <FaSignOutAlt />
            Cerrar Sesión
          </NavItem>
        </div>
      </Sidebar>
      
      <MainContent>
        {renderContent()}
      </MainContent>
    </AdminContainer>
  );
};

export default AdminPanel;
