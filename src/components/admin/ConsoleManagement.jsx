import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';

// Styled Components
const ConsoleList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ConsoleCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
`;

const ConsoleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.25rem;
  }
`;

const ConsoleDetails = styled.div`
  p {
    margin: 0.5rem 0;
    color: var(--text-secondary);
    
    strong {
      color: var(--text-color);
      margin-right: 0.5rem;
    }
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(var(--accent-rgb), 0.1);
    color: var(--accent-color);
  }
  
  & + & {
    margin-left: 0.5rem;
  }
  
  svg {
    margin-right: 0.25rem;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem;
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
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const PrimaryButton = styled.button`
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    background: var(--accent-dark);
  }
  
  &:disabled {
    background: var(--border-color);
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background: none;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  
  &:hover {
    background: var(--hover-bg);
    color: var(--text-color);
  }
`;

// Console Management Component
const ConsoleManagement = () => {
  const [consoles, setConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ps5',
    price: '',
    bufferMins: 10,
    active: true
  });

  // Load consoles from Firestore
  useEffect(() => {
    const loadConsoles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'resources'));
        const consolesData = [];
        querySnapshot.forEach((doc) => {
          consolesData.push({ id: doc.id, ...doc.data() });
        });
        setConsoles(consolesData);
      } catch (error) {
        console.error('Error loading consoles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConsoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (consoleItem) => {
    setEditingId(consoleItem.id);
    setFormData({
      name: consoleItem.name,
      type: consoleItem.type,
      price: consoleItem.price,
      bufferMins: consoleItem.bufferMins || 10,
      active: consoleItem.active !== false
    });
    // Scroll to form
    document.getElementById('console-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'ps5',
      price: '',
      bufferMins: 10,
      active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const consoleData = {
        ...formData,
        price: Number(formData.price),
        bufferMins: Number(formData.bufferMins) || 10
      };

      if (editingId) {
        // Update existing console
        await updateDoc(doc(db, 'resources', editingId), consoleData);
        setConsoles(consoles.map(c => 
          c.id === editingId ? { ...c, ...consoleData } : c
        ));
      } else {
        // Add new console
        const docRef = await addDoc(collection(db, 'resources'), consoleData);
        setConsoles([...consoles, { id: docRef.id, ...consoleData }]);
      }
      
      // Reset form
      handleCancel();
    } catch (error) {
      console.error('Error saving console:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta consola? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'resources', id));
      setConsoles(consoles.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting console:', error);
    }
  };

  if (loading) {
    return <div>Cargando consolas...</div>;
  }

  return (
    <div>
      <h2>Gestión de Consolas</h2>
      
      <div id="console-form">
        <h3>{editingId ? 'Editar Consola' : 'Agregar Nueva Consola'}</h3>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ej: PS5 #1"
            />
          </FormGroup>
          
          <FormGroup>
            <label>Tipo</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="ps5">PlayStation 5</option>
              <option value="ps4">PlayStation 4</option>
              <option value="xbox">Xbox Series X</option>
              <option value="switch">Nintendo Switch</option>
              <option value="simulador">Simulador</option>
            </select>
          </FormGroup>
          
          <FormGroup>
            <label>Precio por hora (en $)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="100"
              placeholder="Ej: 6500"
            />
          </FormGroup>
          
          <FormGroup>
            <label>Tiempo de limpieza (minutos)</label>
            <input
              type="number"
              name="bufferMins"
              value={formData.bufferMins}
              onChange={handleInputChange}
              min="0"
              max="60"
            />
          </FormGroup>
          
          <FormGroup>
            <label>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
              />
              {' '}Activa
            </label>
          </FormGroup>
          
          <ButtonGroup>
            <SecondaryButton type="button" onClick={handleCancel}>
              <FaTimes /> Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit">
              <FaSave /> {editingId ? 'Guardar Cambios' : 'Agregar Consola'}
            </PrimaryButton>
          </ButtonGroup>
        </form>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <h3>Lista de Consolas</h3>
        {consoles.length === 0 ? (
          <p>No hay consolas registradas.</p>
        ) : (
          <ConsoleList>
            {consoles.map(consoleItem => (
              <ConsoleCard key={consoleItem.id}>
                <ConsoleHeader>
                  <h3>{consoleItem.name}</h3>
                  <div>
                    <ActionButton 
                      onClick={() => handleEdit(consoleItem)}
                      title="Editar"
                    >
                      <FaEdit />
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDelete(consoleItem.id)}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </ActionButton>
                  </div>
                </ConsoleHeader>
                <ConsoleDetails>
                  <p><strong>Tipo:</strong> {getConsoleTypeName(consoleItem.type)}</p>
                  <p><strong>Precio:</strong> ${consoleItem.price?.toLocaleString()}/h</p>
                  <p><strong>Estado:</strong> {consoleItem.active ? 'Activa' : 'Inactiva'}</p>
                </ConsoleDetails>
              </ConsoleCard>
            ))}
          </ConsoleList>
        )}
      </div>
    </div>
  );
};

// Helper function to get console type name
const getConsoleTypeName = (type) => {
  const types = {
    ps5: 'PlayStation 5',
    ps4: 'PlayStation 4',
    xbox: 'Xbox Series X',
    switch: 'Nintendo Switch',
    simulador: 'Simulador'
  };
  return types[type] || type;
};

export default ConsoleManagement;
