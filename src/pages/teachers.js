import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaPlus, FaUpload, FaEdit, FaTrash } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import {
  collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as XLSX from 'xlsx';
import CryptoJS from 'crypto-js';

export default function AddTeacher() {
  const [formState, setFormState] = useState({
    name: '',
    username: '',
    password: '',
  });
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [file, setFile] = useState(null);

  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersCollection = collection(db, 'teachers');
      const q = query(teachersCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const teachersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersList);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching teachers.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentsCollection = collection(db, 'departments');
      const q = query(departmentsCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const departmentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(departmentsList);
      const deptMap = departmentsList.reduce((map, dept) => {
        map[dept.id] = dept.name;
        return map;
      }, {});
      setDepartmentMap(deptMap);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching departments.');
    }
  };

  const encryptPassword = (password) => {
    const secretKey = 'your-secret-key'; // Use a secure key; never hard-code in production
    return CryptoJS.AES.encrypt(password, secretKey).toString();
  };

  const validateForm = () => {
    if (!formState.name || !formState.username || !formState.password) {
      setError('All fields are required.');
      return false;
    }
    if (formState.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    setError('');
    return true;
  };
  
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      const teachersCollection = collection(db, 'teachers');
      await addDoc(teachersCollection, {
        name: formState.name,
        username: formState.username,
        password: encryptPassword(formState.password), // Encrypt password here
      });
      setFormState({
        name: '',
        username: '',
        password: '',
      });
      toast.success('Teacher added successfully.');
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err) {
      console.error(err);
      toast.error('Error adding teacher.');
    }
  };
  

  const handleEditTeacher = async () => {
    if (!validateForm()) return;

    try {
      const teacherDoc = doc(db, 'teachers', selectedTeacher.id);
      await updateDoc(teacherDoc, {
        name: formState.name,
        username: formState.username,
        password: encryptPassword(formState.password),
      });
      toast.success('Teacher updated successfully.');
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err) {
      console.error(err);
      toast.error('Error updating teacher.');
    }
  };

  const handleDeleteTeacher = async () => {
    try {
      const teacherDoc = doc(db, 'teachers', selectedTeacher.id);
      await deleteDoc(teacherDoc);
      toast.success('Teacher deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchTeachers();
    } catch (err) {
      console.error(err);
      toast.error('Error deleting teacher.');
    }
  };

  const handleInputChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleDepartmentChange = async (e, row) => {
    const newDepartment = e.target.value;
    try {
      const teacherDoc = doc(db, 'teachers', row.id);
      await updateDoc(teacherDoc, { department: newDepartment });
      toast.success('Department updated successfully.');
      fetchTeachers();
    } catch (err) {
      console.error('Error updating department:', err);
      toast.error('Error updating department.');
    }
  };

  const handleBatchAdd = async () => {
    if (!file) {
      toast.error('Please upload an Excel file.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip the header row
        const rows = json.slice(1);

        for (const row of rows) {
          const [name, username, password] = row;
          if (name && username && password) {
            await addDoc(collection(db, 'teachers'), {
              name,
              username,
              password: encryptPassword(password),
              department: '', // Add a default department if needed
            });
          }
        }

        toast.success('Teachers added successfully.');
        setFile(null);
        fetchTeachers();
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast.error('Error processing the file.');
    }
  };

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Department',
      cell: (row) => (
        <TextField
          select
          value={row.department}
          onChange={(e) => handleDepartmentChange(e, row)}
          variant="standard" // To remove the outlined look
          fullWidth
          SelectProps={{
            disableUnderline: true, // Removes the underline
          }}
          sx={{
            '.MuiSelect-select': {
              padding: '4px 0', // Minimal padding to make it look like text
              fontSize: '0.875rem', // Adjust the font size if needed
            },
            '.MuiSelect-icon': {
              top: 'unset', // Position the dropdown arrow better
            },
          }}
        >
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </TextField>
      ),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          {/* Edit Icon Button */}
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              onClick={() => {
                setSelectedTeacher(row);
                setFormState({
                  name: row.name,
                  username: row.username,
                  password: '', // Password is not stored directly for security reasons
                  selectedDepartment: row.department,
                });
                setModalType('edit');
                setIsModalOpen(true);
              }}
              className="text-blue-500"
            >
              <FaEdit />
            </IconButton>
          </Tooltip>

          {/* Delete Icon Button */}
          <Tooltip title="Delete">
            <IconButton
              color="secondary"
              onClick={() => {
                setSelectedTeacher(row);
                setIsDeleteModalOpen(true);
              }}
              className="text-red-500"
            >
              <FaTrash />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-8">
        {/* Tooltip Buttons Section */}
        <div className="flex justify-between mb-6">
          <div className="flex space-x-4">
            {/* Icon Button to Open Add Teacher Modal */}
            <Tooltip title="Add Teacher">
              <IconButton
                color="primary"
                onClick={() => {
                  setModalType('add');
                  setFormState({
                    name: '',
                    username: '',
                    password: '',
                    selectedDepartment: '',
                  });
                  setIsModalOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-md"
              >
                <FaPlus />
              </IconButton>
            </Tooltip>

            {/* Icon Button for Batch Upload */}
            <Tooltip title="Batch Upload">
              <IconButton
                color="primary"
                onClick={() => document.getElementById('fileInput').click()}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-md"
              >
                <FaUpload />
              </IconButton>
            </Tooltip>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <DataTable
            columns={columns}
            data={teachers}
            pagination
            paginationPerPage={10}
            highlightOnHover
            pointerOnHover
          />
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <DialogTitle>{modalType === 'add' ? 'Add Teacher' : 'Edit Teacher'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              name="name"
              label="Name"
              value={formState.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              name="username"
              label="Username"
              value={formState.username}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              value={formState.password}
              onChange={handleInputChange}
              fullWidth
              required
            />
            {error && <p className="text-red-500">{error}</p>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={modalType === 'add' ? handleAddTeacher : handleEditTeacher}>
              {modalType === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
          <DialogTitle>Delete Teacher</DialogTitle>
          <DialogContent>
            Are you sure you want to delete {selectedTeacher?.name}?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button color="secondary" onClick={handleDeleteTeacher}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
}
