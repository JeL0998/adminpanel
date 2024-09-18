import { useState, useEffect } from 'react';
import { Paper, Button, IconButton, Grid, Divider, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DepartmentCrudModal from '@/components/DepartmentCrudModal';
import CourseCrudModal from '@/components/CourseCrudModal';
import Layout from '@/components/Layout';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [courseList, setCourseList] = useState([{ courseName: '' }]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const departmentSnapshot = await getDocs(collection(db, 'departments'));
    setDepartments(departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchCourses = async (departmentId) => {
    try {
      const coursesSnapshot = await getDocs(collection(db, `departments/${departmentId}/courses`));
      setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch courses.');
    }
  };

  const handleSaveDepartment = async (name) => {
    try {
      if (isEditing && currentData) {
        await updateDoc(doc(db, 'departments', currentData.id), { name });
        toast.success('Department updated successfully.');
      } else {
        await addDoc(collection(db, 'departments'), { name });
        toast.success('Department added successfully.');
      }
      fetchDepartments();
      setDepartmentModalOpen(false);
    } catch (error) {
      toast.error('Failed to save department.');
    }
  };

  const handleSaveCourses = async (courses) => {
    if (!selectedDepartmentId) {
      toast.error('No department selected.');
      return;
    }

    try {
      const batch = writeBatch(db);

      courses.forEach((course) => {
        if (course.courseName.trim()) {
          const courseRef = doc(collection(db, `departments/${selectedDepartmentId}/courses`));
          batch.set(courseRef, { name: course.courseName });
        }
      });

      await batch.commit();
      toast.success('Courses added successfully.');
      fetchCourses(selectedDepartmentId);
      setCourseModalOpen(false);
      setCourseList([{ courseName: '' }]); // Reset course list after saving
    } catch (error) {
      toast.error('Failed to save courses.');
    }
  };

  const handleDelete = async () => {
    try {
      const batch = writeBatch(db);
      if (deleteType === 'department' && itemToDelete) {
        // Delete department and its courses
        const coursesCollection = collection(db, `departments/${itemToDelete.id}/courses`);
        const coursesSnapshot = await getDocs(coursesCollection);
        coursesSnapshot.docs.forEach(courseDoc => batch.delete(doc(db, `departments/${itemToDelete.id}/courses`, courseDoc.id)));
        batch.delete(doc(db, 'departments', itemToDelete.id));
        await batch.commit();
        toast.success('Department and its courses deleted successfully.');
        fetchDepartments();
      } else if (deleteType === 'course' && itemToDelete) {
        // Delete course
        await deleteDoc(doc(db, `departments/${selectedDepartmentId}/courses`, itemToDelete.id));
        toast.success('Course deleted successfully.');
        fetchCourses(selectedDepartmentId);
      }
      setConfirmDeleteOpen(false);
    } catch (error) {
      toast.error('Failed to delete.');
    }
  };

  const handleDepartmentSelection = (departmentId) => {
    setSelectedDepartmentId(departmentId === selectedDepartmentId ? null : departmentId);
    if (departmentId !== selectedDepartmentId) fetchCourses(departmentId);
  };

  const courseColumns = [
    {
      name: <span className="text-lg font-bold">Course Name</span>,
      selector: row => row.name,
      sortable: true,
      style: { fontWeight: 'bold' },
    },
    {
      name: 'Actions',
      button: true,
      cell: row => (
        <IconButton
          onClick={() => {
            setItemToDelete(row);
            setDeleteType('course');
            setConfirmDeleteOpen(true);
          }}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    }
  ];

  return (
    <Layout>
      <Button
        startIcon={<AddIcon />}
        onClick={() => { setDepartmentModalOpen(true); setIsEditing(false); }}
        className="mb-4"
        variant="contained"
        color="primary"
      >
        Add Department
      </Button>

      <Divider className="my-6" />

      <Grid container spacing={3}>
        {departments.map(department => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={department.id}>
            <Paper
              className={`p-4 shadow-lg ${selectedDepartmentId === department.id ? 'border-2 border-blue-500' : ''}`}
              elevation={3}
              onClick={() => handleDepartmentSelection(department.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex justify-between items-center">
                <Typography variant="h6">{department.name}</Typography>
                <div>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the department selection
                      setCurrentData(department);
                      setDepartmentModalOpen(true);
                      setIsEditing(true);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the department selection
                      setItemToDelete(department);
                      setDeleteType('department');
                      setConfirmDeleteOpen(true);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider className="my-6" />

      {selectedDepartmentId && (
        <div className="mt-6">
          <Button
            startIcon={<AddIcon />}
            onClick={() => { setCourseModalOpen(true); setIsEditing(false); }}
            variant="contained"
            color="primary"
            className="mb-4"
          >
            Add Course
          </Button>

          <DataTable
            columns={courseColumns}
            data={courses || []}
            pagination
            paginationPerPage={10}
            highlightOnHover
            dense
            noDataComponent={<div className='m-2'>No courses available.</div>}
            customStyles={{
              headCells: {
                style: {
                  backgroundColor: '#f5f5f5',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  borderBottom: '2px solid #e0e0e0',
                }
              },
              rows: {
                style: {
                  backgroundColor: '#fff',
                  color: '#333',
                  '&:nth-of-type(even)': {
                    backgroundColor: '#f9f9f9'
                  },
                  '&:hover': {
                    backgroundColor: '#e0f7fa',
                    boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer'
                  }
                }
              },
              pagination: {
                style: {
                  fontSize: '14px',
                }
              }
            }}
            className="mt-2"
          />
        </div>
      )}

      <DepartmentCrudModal
        open={departmentModalOpen}
        onClose={() => setDepartmentModalOpen(false)}
        onSave={handleSaveDepartment}
        isEditing={isEditing}
        departmentData={currentData}
      />

      <CourseCrudModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSave={handleSaveCourses}
        courses={courseList}
        setCourses={setCourseList}
      />

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteType === 'department' ? 'department and its courses' : 'course'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleDelete} color="secondary">Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
