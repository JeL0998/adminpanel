import { useState } from 'react';
import Link from 'next/link';
import { FaChalkboardTeacher, FaUniversity, FaHome, FaUserCheck, FaBook, FaCalendar, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/router'; import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';


const Layout = ({ children }) => {
  const router = useRouter();
  const activeTab = router.pathname;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out");
      router.push('/');
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex overflow-y-auto flex-col h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out">
          <div className="p-6 text-2xl font-semibold tracking-wider border-b border-gray-700 flex items-center">
            <FaUniversity className="mr-3 text-xl" />
            Admin Panel
          </div>

          {/* Navigation Links */}
          <nav className="mt-6">
            <ul className="space-y-2">
              <Link href="/main">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 ease-in-out ${activeTab === "/main" ? "bg-gray-800" : ""
                    }`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <FaHome />
                    Dashboard
                  </div>
                </li>
              </Link>

              <Link href="/teachers">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 ease-in-out ${activeTab === "/teachers" ? "bg-gray-800" : ""
                    }`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <FaChalkboardTeacher />
                    Teachers
                  </div>
                </li>
              </Link>

              <Link href="/students">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 ease-in-out ${activeTab === "/students" ? "bg-gray-800" : ""
                    }`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <FaUsers />
                    Students
                  </div>
                </li>
              </Link>

              <Link href="/departments">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 ease-in-out ${activeTab === "/departments" ? "bg-gray-800" : ""
                    }`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <FaBook />
                    Department
                  </div>
                </li>
              </Link>

              <Link href="/subjects">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-700 transition-colors duration-300 ease-in-out ${activeTab === "/subjects" ? "bg-gray-700" : ""
                    }`}
                >
                  <FaCalendar />
                  Manage Subjects
                </li>
              </Link>

              <Link href="/report">
                <li
                  className={`py-2 px-6 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 ease-in-out ${activeTab === "/report" ? "bg-gray-800" : ""
                    }`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <FaUserCheck />
                    Attendance Report
                  </div>
                </li>
              </Link>
            </ul>
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-700 mt-6"></div>

          {/* Footer */}
          <div className="mt-auto p-6">
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ease-in-out"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto text-primary">
          {/* Children content */}
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 text-center border-t border-gray-700">
        © 2024 Admin Panel - All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
