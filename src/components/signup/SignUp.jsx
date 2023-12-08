/* eslint-disable no-unused-vars */
import { Box, Button, Group, PasswordInput, TextInput } from '@mantine/core';
import { hasLength, isEmail, useForm } from '@mantine/form';
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App';
import './signup.css';

export default function SignUp() {
    const navigate = useNavigate();
    const { isAuthenticated, setIsAuthenticated } = useContext(NotesContext);

    const notify = () => {
        toast.success('Successfully signed up', {
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
        validateInputOnBlur: true,
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },

        validate: {
            firstName: hasLength({ min: 2, max: 100 }, 'Name must be 2-100 characters long'),
            lastName: hasLength({ min: 2, max: 100 }, 'Last name must be 2-100 characters long'),
            email: isEmail('Invalid email'),
            password: hasLength({ min: 2, max: 100 }, 'Password must be 2-100 characters long'),
            confirmPassword: (value, values) => (value !== values.password || value == '' ? 'Passwords do not match' : null),
        },
    });

    const handleSignupError = (msg) => {
        form.setErrors({ email: 'User alerady exists' });
    };

    const handleSignupSubmit = async (e) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.values),
            });

            const parseRes = await response.json();

            if (parseRes == 'User alerady exists') {
                handleSignupError();
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
        }
    };

    return (
        <div className="signup-login-form-container">
            <div className="signup-login-form">
                <Box maw={400} mx="auto">
                    <form onSubmit={form.onSubmit(handleSignupSubmit)}>
                        <TextInput label="Name" placeholder="name" withAsterisk {...form.getInputProps('firstName')} />
                        <TextInput label="Last name" placeholder="last name" withAsterisk mt="md" {...form.getInputProps('lastName')} />
                        <TextInput label="Email" placeholder="email" withAsterisk mt="md" {...form.getInputProps('email')} />

                        <PasswordInput label="Password" placeholder="password" mt="md" withAsterisk {...form.getInputProps('password')} />
                        <PasswordInput
                            mt="md"
                            label="Confirm password"
                            placeholder="confirm password"
                            withAsterisk
                            {...form.getInputProps('confirmPassword')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button type="submit">Submit</Button>
                        </Group>
                        <Group className="login-link" justify="center" mt="md">
                            <Group justify="center">
                                Already have an account?
                                <Link to="/login">Login</Link>
                            </Group>
                        </Group>
                    </form>
                </Box>
            </div>
        </div>
    );
}
