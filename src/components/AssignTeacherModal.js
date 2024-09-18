import { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function AssignTeacherModal({ open, onClose, onSave, teachers, selectedTeacherId }) {
  const [teacherId, setTeacherId] = useState(selectedTeacherId);

  const handleSave = () => {
    onSave(teacherId);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign Teacher</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <InputLabel>Teacher</InputLabel>
          <Select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            label="Teacher"
          >
            {teachers.map(teacher => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button onClick={handleSave} color="secondary">Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
