import { useState, useEffect } from 'react';
import {
  Paper, Button, Grid, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Dialog,
  DialogActions, DialogContent, DialogTitle, TextField, Typography, CircularProgress
} from '@mui/material';
import { setDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaUpload } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import useSchoolData from '@/hooks/useSchoolData';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebaseConfig';

const ManageSubjects = () => {
  const { departments, teachers, courses, subjects, loading, fetchCourses, fetchSubjects } = useSchoolData();
  const [semester, setSemester] = useState('1st Sem');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newDay, setNewDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    if (selectedDepartment) fetchCourses(selectedDepartment);
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) fetchSubjects(selectedCourse);
  }, [selectedCourse, semester]);

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
    setSelectedCourse(null);
    setSelectedSubjects([]);
  };

  const handleDepartmentSelection = (departmentId) => {
    setSelectedDepartment(departmentId === selectedDepartment ? null : departmentId);
  };

  const handleCourseSelection = (courseId) => {
    setSelectedCourse(courseId === selectedCourse ? null : courseId);
  };

  const handleSubjectSave = async () => {
    if (!currentSubject) return;

    const subjectWithSemester = { ...currentSubject, semester };
    const isDuplicate = subjects.some(sub => sub.subjectCode === subjectWithSemester.subjectCode);

    if (isDuplicate) {
      toast.error('Subject code already exists in this course.');
      return;
    }

    try {
      const subjectRef = doc(db, `courses/${selectedCourse}/subjects`, subjectWithSemester.subjectCode);
      if (isEditing) {
        await updateDoc(subjectRef, subjectWithSemester);
        toast.success('Subject updated successfully.');
      } else {
        await setDoc(subjectRef, subjectWithSemester);
        toast.success('Subject added successfully.');
      }
      fetchSubjects(selectedCourse);
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save subject.');
    }
  };

  const handleBatchUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const subjectsToAdd = data.map(item => ({
        subjectCode: item['Subject Code'].toUpperCase(),
        description: item['Description'],
        units: item['Units'],
        year: item['Year'],
        semester,
        day: item['Day'],
        time: item['Time'],
      }));

      const batch = writeBatch(db);
      const existingSubjects = new Set(subjects.map(sub => sub.subjectCode));

      subjectsToAdd.forEach(subject => {
        if (!existingSubjects.has(subject.subjectCode)) {
          batch.set(doc(db, `courses/${selectedCourse}/subjects`, subject.subjectCode), subject);
        }
      });

      try {
        await batch.commit();
        toast.success('Subjects uploaded successfully.');
        fetchSubjects(selectedCourse);
      } catch (error) {
        toast.error('Failed to upload subjects.');
      } finally {
        setFileInputKey(Date.now());
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, `courses/${selectedCourse}/subjects`, subjectId));
      toast.success('Subject deleted successfully.');
      fetchSubjects(selectedCourse);
    } catch (error) {
      toast.error('Failed to delete subject.');
    }
  };

  const handleBatchDelete = async () => {
    const batch = writeBatch(db);
    selectedSubjects.forEach(subjectId => {
      batch.delete(doc(db, `courses/${selectedCourse}/subjects`, subjectId));
    });

    try {
      await batch.commit();
      toast.success('Subjects deleted successfully.');
      fetchSubjects(selectedCourse);
    } catch (error) {
      toast.error('Failed to delete subjects.');
    }
  };

  const handleTeacherChange = async (e, row) => {
    const newTeacherId = e.target.value;
    try {
      const subjectRef = doc(db, `courses/${selectedCourse}/subjects`, row.subjectCode);
      await updateDoc(subjectRef, { teacher: newTeacherId });
      toast.success('Teacher updated successfully.');
      fetchSubjects(selectedCourse);
    } catch (err) {
      console.error('Error updating teacher:', err);
      toast.error('Error updating teacher.');
    }
  };

  const handleCellClick = (row) => {
    setSelectedSubject(row);
    setNewDay(row.day);
    setNewTime(row.time);
    setOpenModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedSubject) return;

    try {
      const subjectRef = doc(db, `courses/${selectedCourse}/subjects`, selectedSubject.subjectCode);
      await updateDoc(subjectRef, { day: newDay, time: newTime });
      toast.success('Date and time updated successfully.');
      setOpenModal(false);
      fetchSubjects(selectedCourse);
    } catch (err) {
      console.error('Error updating date and time:', err);
      toast.error('Error updating date and time.');
    }
  };

  const handleCloseModal = () => {
    setSubjectModalOpen(false);
    setCurrentSubject(null);
    setIsEditing(false);
  };

  const subjectColumns = [
    { name: 'Subject Code', selector: row => row.subjectCode, sortable: true },
    { name: 'Year', selector: row => row.year, sortable: true },
    {
      name: 'Day',
      cell: (row) => (
        <div
          onClick={() => handleCellClick(row)}
          style={{
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px', 
            transition: 'background-color 0.3s', 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#90e0ef'} 
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {row.day}
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Time',
      cell: (row) => (
        <div
          onClick={() => handleCellClick(row)}
          style={{
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#90e0ef'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} 
        >
          {row.time}
        </div>
      ),
    },
    {
      name: 'Teacher',
      cell: row => (
        <TextField
          select
          value={row.teacher || ''}
          onChange={(e) => handleTeacherChange(e, row)}
          variant="standard"
          fullWidth
          SelectProps={{
            disableUnderline: true,
          }}
          sx={{
            '.MuiSelect-select': {
              padding: '4px 0',
              fontSize: '0.875rem',
            },
            '.MuiSelect-icon': {
              top: 'unset',
            },
          }}
        >
          {teachers.map(teacher => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      name: 'Actions', cell: row => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              setCurrentSubject(row);
              setIsEditing(true);
              setSubjectModalOpen(true);
            }}>
              <FaEdit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDeleteSubject(row.subjectCode)}>
              <FaTrash />
            </IconButton>
          </Tooltip>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-6 mb-6">
        {/* Semester Selection */}
        <FormControl fullWidth variant="outlined" className="mb-6">
          <InputLabel>Semester</InputLabel>
          <Select value={semester} onChange={handleSemesterChange} label="Semester">
            <MenuItem value="1st Sem">1st Sem</MenuItem>
            <MenuItem value="2nd Sem">2nd Sem</MenuItem>
          </Select>
        </FormControl>

        {/* Department Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <CircularProgress />
          </div>
        ) : (
          <Grid container spacing={3} className="mb-6 mt-6">
            {departments.map(department => (
              <Grid item xs={12} sm={6} md={4} key={department.id}>
                <Paper
                  className={`p-4 cursor-pointer rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out ${selectedDepartment === department.id ? 'border-2 border-blue-500' : ''}`}
                  onClick={() => handleDepartmentSelection(department.id)}
                >
                  <Typography variant="h6" className="font-semibold">{department.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Course Cards */}
        {selectedDepartment && (
          <>
            <Typography variant="h5" className="mb-4">Courses</Typography>
            <Grid container spacing={3} className="mb-6">
              {courses.map(course => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <Paper
                    className={`p-4 cursor-pointer rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out ${selectedCourse === course.id ? 'border-2 border-blue-500' : ''}`}
                    onClick={() => handleCourseSelection(course.id)}
                  >
                    <Typography variant="h6" className="font-semibold">{course.name}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Subject DataTable */}
        {selectedCourse && (
          <>
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h5">Subjects</Typography>
              <div className="flex gap-2">
                <Tooltip title="Add Subject">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setIsEditing(false);
                      setCurrentSubject(null);
                      setSubjectModalOpen(true);
                    }}
                  >
                    <FaPlus />
                  </IconButton>
                </Tooltip>
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => e.target.files[0] && handleBatchUpload(e.target.files[0])}
                  hidden
                  id="batch-upload"
                />
                <Tooltip title="Batch Upload">
                  <IconButton color="secondary" component="label" htmlFor="batch-upload">
                    <FaUpload />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Selected">
                  <IconButton color="error" onClick={handleBatchDelete}>
                    <FaTrash />
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            <DataTable
              columns={subjectColumns}
              data={subjects}
              selectableRows
              onSelectedRowsChange={({ selectedRows }) => setSelectedSubjects(selectedRows.map(row => row.subjectCode))}
            />

            {/* Edit Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Edit Date and Time</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Day"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  margin="normal"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                <Button onClick={handleSaveChanges} variant="contained" color="primary">Save Changes</Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        {/* Subject Modal */}
        {subjectModalOpen && (
          <Dialog open={subjectModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Subject Code"
                value={currentSubject?.subjectCode || ''}
                onChange={(e) => setCurrentSubject({ ...currentSubject, subjectCode: e.target.value })}
                margin="normal"
                disabled={isEditing}
              />
              <TextField
                fullWidth
                label="Description"
                value={currentSubject?.description || ''}
                onChange={(e) => setCurrentSubject({ ...currentSubject, description: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Units"
                type="number"
                value={currentSubject?.units || ''}
                onChange={(e) => setCurrentSubject({ ...currentSubject, units: e.target.value })}
                margin="normal"
              />
              {/* More fields can be added as necessary */}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button onClick={handleSubjectSave} variant="contained" color="primary">{isEditing ? 'Save Changes' : 'Add Subject'}</Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default ManageSubjects;