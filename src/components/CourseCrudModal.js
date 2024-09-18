import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';

export default function CourseCrudModal({ open, onClose, onSave, courses, setCourses }) {
  const handleCourseNameChange = (index, event) => {
    const newCourses = [...courses];
    newCourses[index].courseName = event.target.value;
    setCourses(newCourses);
  };

  const handleAddCourse = () => {
    setCourses([...courses, { courseName: '' }]);
  };

  const handleDeleteCourse = (index) => {
    const newCourses = courses.filter((_, i) => i !== index);
    setCourses(newCourses);
  };

  const handleSave = () => {
    const validCourses = courses.filter(course => course.courseName.trim() !== '');
    if (validCourses.length === 0) {
      toast.error('Please add at least one course with a valid name.');
      return;
    }

    const uniqueCourseNames = new Set();
    for (const course of validCourses) {
      if (uniqueCourseNames.has(course.courseName.trim())) {
        toast.error(`Course "${course.courseName.trim()}" is already in the list.`);
        return;
      }
      uniqueCourseNames.add(course.courseName.trim());
    }

    onSave(validCourses);
  };

  useEffect(() => {
    if (!open) {
      setCourses([{ courseName: '' }]);
    }
  }, [open, setCourses]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="bg-blue-500 text-white">Add/Update Courses</DialogTitle>
      <DialogContent className="p-6">
        {courses.map((course, index) => (
          <Grid container spacing={2} key={index} alignItems="center" className="mb-4">
            <Grid item xs={10}>
              <TextField
                className="w-full mt-4"
                label={`Course ${index + 1}`}
                variant="outlined"
                fullWidth
                value={course.courseName}
                onChange={(event) => handleCourseNameChange(index, event)}
                error={!course.courseName.trim()}
                helperText={!course.courseName.trim() ? 'Course name is required' : ''}
                InputProps={{
                  classes: {
                    root: 'bg-gray-100'
                  }
                }}
                InputLabelProps={{
                  classes: {
                    root: 'text-gray-700'
                  }
                }}
                FormHelperTextProps={{
                  classes: {
                    root: 'text-red-500'
                  }
                }}
              />
            </Grid>
            <Grid item xs={2} className="flex justify-end">
              <IconButton
                onClick={() => handleDeleteCourse(index)}
                color="error"
                className="hover:bg-red-100"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
          variant="contained"
          color="primary"
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300"
        >
          Add Course
        </Button>
      </DialogContent>
      <DialogActions className="p-4 bg-gray-100">
        <Button onClick={onClose} color="default" className="hover:bg-gray-200 transition-all duration-300">Cancel</Button>
        <Button onClick={handleSave} color="primary" className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 text-black">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
