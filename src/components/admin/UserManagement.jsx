import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FaUserCog, FaUserCheck, FaUserTimes, FaSearch } from 'react-icons/fa';
import styled from 'styled-components';

// Styled Components
const UserList = styled.div`
  margin-top: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const UserRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem 1.5rem;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 2fr 1.5fr 1fr 1fr;
    grid-template-rows: auto auto;
    
    div:nth-child(5) {
      grid-column: 1 / 2;
      grid-row: 2 / 3;
    }
    
    div:nth-child(6) {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
    }
    
    div:last-child {
      grid-column: 4 / 5;
      grid-row: 1 / 3;
      display: flex;
      justify-content: flex-end;
    }
  }
`;

const UserHeader = styled(UserRow)`
  font-weight: 600;
  background: var(--hover-bg);
  color: var(--text-secondary);
  
  @media (max-width: 1200px) {
    display: none;
  }
`;

const UserCell = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.active ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'};
  color: ${props => props.active ? '#2ecc71' : '#e74c3c'};
`;

const RoleSelect = styled.select`
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-color);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
    }
  }
  
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
`;

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  // Load users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        
        const usersData = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.displayName?.toLowerCase().includes(term) || 
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const toggleUserStatus = async (user) => {
    if (!window.confirm(`¿Está seguro de que desea ${user.disabled ? 'habilitar' : 'deshabilitar'} a ${user.displayName || 'este usuario'}?`)) {
      return;
    }
    
    try {
      setUpdating(prev => ({ ...prev, [user.id]: true }));
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.id), {
        disabled: !user.disabled,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, disabled: !u.disabled } : u
      ));
      
    } catch (error) {
      console.error('Error toggling user status:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [user.id]: false }));
    }
  };

  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div>
      <h2>Gestión de Usuarios</h2>
      
      <SearchBar>
        <FaSearch />
        <input
          type="text"
          placeholder="Buscar usuarios por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>
      
      {filteredUsers.length === 0 ? (
        <p>No se encontraron usuarios.</p>
      ) : (
        <UserList>
          <UserHeader>
            <UserCell>Nombre</UserCell>
            <UserCell>Email</UserCell>
            <UserCell>Rol</UserCell>
            <UserCell>Estado</UserCell>
            <UserCell>Registrado</UserCell>
            <UserCell>Último Acceso</UserCell>
            <div></div>
          </UserHeader>
          
          {filteredUsers.map(user => (
            <UserRow key={user.id}>
              <UserCell title={user.displayName || 'Sin nombre'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img 
                    src={user.photoURL || '/default-avatar.png'} 
                    alt={user.displayName || 'Usuario'} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                  {user.displayName || 'Usuario sin nombre'}
                </div>
              </UserCell>
              <UserCell title={user.email}>{user.email}</UserCell>
              <UserCell>
                <RoleSelect
                  value={user.role || 'user'}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={updating[user.id]}
                >
                  <option value="admin">Administrador</option>
                  <option value="staff">Staff</option>
                  <option value="user">Usuario</option>
                </RoleSelect>
              </UserCell>
              <UserCell>
                <StatusBadge active={!user.disabled}>
                  {user.disabled ? 'Deshabilitado' : 'Activo'}
                </StatusBadge>
              </UserCell>
              <UserCell>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </UserCell>
              <UserCell>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nunca'}
              </UserCell>
              <div>
                <button 
                  onClick={() => toggleUserStatus(user)}
                  disabled={updating[user.id]}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: user.disabled ? '#2ecc71' : '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    
                    '&:hover': {
                      background: 'rgba(0, 0, 0, 0.05)'
                    },
                    
                    '&:disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {user.disabled ? <FaUserCheck /> : <FaUserTimes />}
                </button>
              </div>
            </UserRow>
          ))}
        </UserList>
      )}
    </div>
  );
};

export default UserManagement;
