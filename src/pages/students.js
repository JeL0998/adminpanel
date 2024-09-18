import { useState, useEffect } from 'react';
import { Paper, Button, Grid, Dialog, DialogActions, DialogContent, DialogTitle, Typography, CircularProgress, IconButton, Tooltip, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { FaPlus, FaUpload, FaEdit, FaTrash } from 'react-icons/fa';
import { collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import Layout from '@/components/Layout';
import * as XLSX from 'xlsx';

const ManageStudents = () => {
  const [coursesByDepartment, setCoursesByDepartment] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const departmentsSnapshot = await getDocs(collection(db, 'departments'));
      const departments = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let coursesByDept = {};

      for (const department of departments) {
        const coursesSnapshot = await getDocs(collection(db, `departments/${department.id}/courses`));
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        coursesByDept[department.id] = { departmentName: department.name, courses };
      }

      setCoursesByDepartment(coursesByDept);
    } catch (error) {
      toast.error('Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId) => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, `courses/${courseId}/students`));
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSave = async () => {
    if (!currentStudent) return;

    if (currentStudent.age < 18) {
      toast.error('Age must be 18 or older.');
      return;
    }

    const studentRef = doc(db, `courses/${selectedCourse}/students`, currentStudent.name);
    try {
      if (isEditing) {
        await setDoc(studentRef, currentStudent, { merge: true });
        toast.success('Student updated successfully.');
      } else {
        await setDoc(studentRef, currentStudent);
        toast.success('Student added successfully.');
      }
      fetchStudents(selectedCourse);
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save student.');
    }
  };

  const handleBatchUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const studentsToAdd = data.map(item => ({
        name: item['Name'],
        age: item['Age'],
        gender: item['Gender'],
        course: item['Course'],
      }));

      const batch = writeBatch(db);

      studentsToAdd.forEach(student => {
        if (student.course === selectedCourse) {
          batch.set(doc(db, `courses/${selectedCourse}/students`, student.name), student);
        }
      });

      try {
        await batch.commit();
        toast.success('Students uploaded successfully.');
        fetchStudents(selectedCourse);
      } catch (error) {
        toast.error('Failed to upload students.');
      } finally {
        setFileInputKey(Date.now());
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!studentId) {
      toast.error('Student ID is required for deletion.');
      return;
    }
    try {
      await deleteDoc(doc(db, `courses/${selectedCourse}/students`, studentId));
      toast.success('Student deleted successfully.');
      fetchStudents(selectedCourse);
    } catch (error) {
      toast.error('Failed to delete student.');
    }
  };

  const handleOpenCourseModal = () => setCourseModalOpen(true);
  const handleCloseModal = () => {
    setStudentModalOpen(false);
    setCourseModalOpen(false);
    setCurrentStudent(null);
    setIsEditing(false);
  };

  const studentColumns = [
    { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'Age', selector: row => row.age, sortable: true },
    { name: 'Gender', selector: row => row.gender },
    { name: 'Course', selector: row => row.course },
    { name: 'Actions', cell: row => (
      <div className="flex gap-2">
        <Tooltip title="Edit">
          <IconButton onClick={() => {
            setCurrentStudent(row);
            setIsEditing(true);
            setStudentModalOpen(true);
          }}>
            <FaEdit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton onClick={() => handleDeleteStudent(row.name)}>
            <FaTrash />
          </IconButton>
        </Tooltip>
      </div>
    )}
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Loader */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <CircularProgress />
          </div>
        ) : (
          <>
            {/* Student Management Buttons */}
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h5">Students</Typography>
              <div className="flex gap-2">
                <Tooltip title="Add Student">
                  <IconButton color="primary" onClick={() => {
                    setIsEditing(false);
                    setCurrentStudent({ name: '', age: '', gender: 'Male', course: '' });
                    setStudentModalOpen(true);
                  }}>
                    <FaPlus />
                  </IconButton>
                </Tooltip>
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => e.target.files[0] && handleBatchUpload(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Tooltip title="Upload">
                    <IconButton color="primary" component="span">
                      <FaUpload />
                    </IconButton>
                  </Tooltip>
                </label>
              </div>
            </div>

            {/* Student DataTable */}
            <DataTable
              columns={studentColumns}
              data={students}
              pagination
            />
          </>
        )}

        {/* Student Modal */}
        <Dialog open={studentModalOpen} onClose={handleCloseModal}>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={currentStudent?.name || ''}
              onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
            />
            <TextField
              label="Age"
              fullWidth
              margin="normal"
              type="number"
              value={currentStudent?.age || ''}
              onChange={(e) => setCurrentStudent({ ...currentStudent, age: e.target.value })}
              inputProps={{ min: 18 }}
            />
            <FormControl fullWidth margin="normal">
              <Select
                value={currentStudent?.gender || 'Male'}
                onChange={(e) => setCurrentStudent({ ...currentStudent, gender: e.target.value })}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Course"
              fullWidth
              margin="normal"
              value={currentStudent?.course || ''}
              onClick={handleOpenCourseModal}
              readOnly
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              onClick={handleStudentSave}
              color="primary"
              disabled={!currentStudent?.name || !currentStudent?.age || !currentStudent?.gender || !currentStudent?.course}
            >
              {isEditing ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Course Selection Modal */}
        <Dialog open={courseModalOpen} onClose={handleCloseModal}>
          <DialogTitle>Select Course</DialogTitle>
          <DialogContent>
            <div className="space-y-4">
              {Object.entries(coursesByDepartment).map(([deptId, { departmentName, courses }]) => (
                <div key={deptId} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <Typography variant="h6" className="mb-2">{departmentName}</Typography>
                  <Grid container spacing={2}>
                    {courses.map(course => (
                      <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            setCurrentStudent(prev => ({ ...prev, course: course.name }));
                            setCourseModalOpen(false);
                          }}
                          className="bg-white hover:bg-gray-100 text-gray-700"
                        >
                          {course.name}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManageStudents;
