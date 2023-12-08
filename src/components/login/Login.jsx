/* eslint-disable no-unused-vars */
import { Box, Button, Group, Paper, PasswordInput, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotesContext } from '../../App';
import '../signup/signup.css';

export default function Login() {
    const navigate = useNavigate();
    const context = useContext(NotesContext);
    const { isAuthenticated, setIsAuthenticated } = context;

    const notify = () => {
        toast.success('Successfully logged in', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
    };

    const form = useForm({
        clearInputErrorOnChange: true,
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: isNotEmpty(),
            password: isNotEmpty(),
        },
    });

    const handleLoginError = () => {
        form.setErrors({ email: 'Incorrect email or password', password: 'Incorrect email or password' });
    };

    const handleLoginSubmit = async (e) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.values),
            });

            const parseRes = await response.json();

            if (parseRes == 'Password or email is incorrect' || parseRes == "User doesn't exist") {
                handleLoginError();
                setIsAuthenticated(false);
            } else {
                sessionStorage.setItem('jwt-token', parseRes.token);
                setIsAuthenticated(true);
                notify();
                navigate('/', { replace: true });
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
            setIsAuthenticated(false);
        }
    };

    return (
        <>
            <div className="signup-login-form-container">
                <div className="signup-login-form">
                    <Box maw={400} mx="auto">
                        <form onSubmit={form.onSubmit(handleLoginSubmit)}>
                            <TextInput label="Email" placeholder="email" mt="md" {...form.getInputProps('email')} autoFocus />

                            <PasswordInput label="Password" placeholder="password" mt="md" {...form.getInputProps('password')} />

                            <Group justify="flex-end" mt="md">
                                <Button type="submit">Submit</Button>
                            </Group>
                            <Group justify="center" mt="md">
                                Don&apos;t have an account?
                                <Link to="/signup">Sign up</Link>
                            </Group>
                        </form>
                    </Box>
                </div>
            </div>
        </>
    );
}
