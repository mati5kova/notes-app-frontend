import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { createContext, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';
import Login from './components/login/Login.jsx';
import MainPage from './components/mainpage/MainPage.jsx';
import NotFound from './components/notfound/NotFound.jsx';
import SignUp from './components/signup/SignUp.jsx';

export const NotesContext = createContext();

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const validAuth = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/is-verify`, {
                method: 'GET',
                headers: { 'jwt-token': localStorage.getItem('jwt-token') },
            });

            const parseRes = await response.json();
            parseRes === true ? setIsAuthenticated(true) : setIsAuthenticated(false);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    useEffect(() => {
        validAuth();
    }, []);

    return (
        <NotesContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover={false}
                theme="light"
            />
            <MantineProvider>
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </MantineProvider>
        </NotesContext.Provider>
    );
}
