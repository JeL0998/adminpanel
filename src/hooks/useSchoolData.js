import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';

const useSchoolData = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const teachersSnapshot = await getDocs(collection(db, 'teachers'));

        const departmentsList = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const teachersList = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setDepartments(departmentsList);
        setTeachers(teachersList);
      } catch (error) {
        toast.error('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchCourses = async (departmentId) => {
    setLoading(true);
    try {
      const coursesSnapshot = await getDocs(collection(db, `departments/${departmentId}/courses`));
      setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (courseId) => {
    setLoading(true);
    try {
      const subjectsSnapshot = await getDocs(collection(db, `courses/${courseId}/subjects`));
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch subjects.');
    } finally {
      setLoading(false);
    }
  };

  return {
    departments,
    teachers,
    courses,
    subjects,
    loading,
    fetchCourses,
    fetchSubjects,
  };
};

export default useSchoolData;
