import { useState, useEffect } from 'react';
import { TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const DepartmentCrudModal = ({ open, onClose, onSave, initialData, isEditMode }) => {
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setDepartmentName(initialData.name || '');
      } else {
        setDepartmentName('');
      }
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!departmentName.trim()) {
      alert('Please enter a department name.');
      return;
    }
    onSave(departmentName);
  };

  const handleClose = () => {
    setDepartmentName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditMode ? 'Edit Department' : 'Add Department'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Department Name"
          variant="outlined"
          fullWidth
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          className="mt-2"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} color="primary" variant="contained">{isEditMode ? 'Update' : 'Add'} Department</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentCrudModal;
