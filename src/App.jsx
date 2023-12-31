import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { createContext, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import './App.css';
import Login from './components/login/Login.jsx';
import MainPage from './components/mainpage/MainPage.jsx';
import NotFound from './components/notfound/NotFound.jsx';
import SignUp from './components/signup/SignUp.jsx';
import UserSettings from './components/usersettings/UserSettings.jsx';

export const NotesContext = createContext();

export default function App() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const notify = () => {
        toast.error('Session ran out, click to login back and continue', {
            position: 'top-center',
            autoClose: false,
            closeOnClick: true,
            draggable: true,
            onClick: () => navigate('/login'),
        });
    };

    const validAuth = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/is-verify`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });

            const parseRes = await response.json();
            if (parseRes === true) {
                toast.dismiss();
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }

            return parseRes;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    useEffect(() => {
        validAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated === true) {
            const interval = setInterval(async () => {
                const response = await validAuth();
                if (response === 'Not authorized') {
                    notify();
                }
            }, 15 * 60 * 1000); //15min
            return () => {
                clearInterval(interval);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return (
        <NotesContext.Provider value={{ isAuthenticated, setIsAuthenticated, userEmail, setUserEmail }}>
            <ToastContainer />
            <MantineProvider>
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/account" element={<UserSettings />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </MantineProvider>
        </NotesContext.Provider>
    );
}
