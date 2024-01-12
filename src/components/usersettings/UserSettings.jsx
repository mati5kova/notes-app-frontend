import { Box, Button, Group, PasswordInput, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App';
import './usersettings.css';

export default function UserSettings() {
    const [loading, { open, close }] = useDisclosure(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(NotesContext);

    const notify = (msg, type) => {
        if (type === 'success') {
            toast.success(msg, {
                position: 'top-right',
                autoClose: 5000,
                pauseOnHover: false,
            });
        } else if (type === 'error') {
            toast.error(msg, {
                position: 'top-right',
                autoClose: 5000,
                pauseOnHover: false,
            });
        }
    };

    const form = useForm({
        clearInputErrorOnChange: true,
        initialValues: {
            name: '',
            lastName: '',
            email: '',
            currentPassword: '',
            newPassword: '',
            repeatPassword: '',
        },

        validate: {
            currentPassword: isNotEmpty(),
            newPassword: (value, values) => {
                if (value.length === 0) {
                    return true;
                } else if (value.length < 2 || value.length > 100) {
                    return 'Password must be 2-100 characters long';
                } else if (values.repeatPassword !== '' && value !== values.repeatPassword) {
                    return 'Passwords do not match';
                } else {
                    return null;
                }
            },
            repeatPassword: (value, values) => {
                if (value.length === 0) {
                    return true;
                } else if (value !== values.newPassword) {
                    return 'Passwords do not match';
                } else {
                    return null;
                }
            },
        },
    });

    const handleFormSubmit = async () => {
        if (form.isValid()) {
            open();
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/change-credentials`, {
                    method: 'POST',
                    headers: { 'jwt-token': sessionStorage.getItem('jwt-token'), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword: form.values.currentPassword,
                        newPassword: form.values.newPassword,
                        repeatPassword: form.values.repeatPassword,
                    }),
                });

                if (response.ok) {
                    const { msg } = await response.json();

                    if (msg === 'Passwords do not match') {
                        close();
                        form.setErrors({ newPassword: 'Passwords do not match', repeatPassword: 'Passwords do not match' });
                    } else if (msg === 'Password incorrect') {
                        close();
                        form.setErrors({ currentPassword: 'Password incorrect', newPassword: 'Password incorrect', repeatPassword: 'Password incorrect' });
                    } else if (msg === "New password can't be your old password") {
                        close();
                        form.setErrors({ newPassword: "New password can't be your old password", repeatPassword: "New password can't be your old password" });
                    } else if (msg === 'Failed to update password') {
                        close();
                        notify('Failed to update password', 'error');
                    } else if (msg === 'Password updated') {
                        close();
                        notify('Successfully updated password', 'success');
                        form.setValues({ currentPassword: '', newPassword: '', repeatPassword: '' });
                    } else {
                        close();
                        notify('Oops, something went wrong!', 'error');
                    }
                } else {
                    close();
                    notify('Oops, something went wrong!', 'error');
                }
            } catch (error) {
                close();
                notify('Oops, something went wrong!', 'error');
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            }
        }
    };

    const getUserInfo = async () => {
        form.setValues({ name: 'loading...', lastName: 'loading...', email: 'loading...' });
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/info`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token'), 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const parseRes = await response.json();
                form.setFieldValue('name', parseRes.user_firstname);
                form.setFieldValue('lastName', parseRes.user_lastname);
                form.setFieldValue('email', parseRes.user_email);
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated !== true) {
            navigate('/');
            return;
        }
        getUserInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="signup-login-form-container">
            <Box mx="auto">
                <form onSubmit={form.onSubmit(handleFormSubmit)}>
                    <div className="name-lastname">
                        <TextInput label="Name" disabled style={{ marginRight: '1rem' }} {...form.getInputProps('name')} />
                        <TextInput label="Last name" disabled {...form.getInputProps('lastName')} />
                    </div>
                    <TextInput label="Email" mt="sm" disabled style={{ marginBottom: '1.2rem' }} {...form.getInputProps('email')} />

                    <PasswordInput label="Current passsword" placeholder="password" mt="xs" {...form.getInputProps('currentPassword')} />
                    <PasswordInput label="New password" placeholder="new password" mt="xs" {...form.getInputProps('newPassword')} />
                    <PasswordInput label="Repeat password" placeholder="repeat password" mt="xs" {...form.getInputProps('repeatPassword')} />

                    <Group mt="xl" className="button-bottom-settings">
                        <Button onClick={() => navigate('/')} className="new-note-cancel" variant="filled" color="gray">
                            Back
                        </Button>
                        <Button type="submit" loading={loading} loaderProps={{ type: 'dots' }}>
                            Submit
                        </Button>
                    </Group>
                </form>
            </Box>
        </div>
    );
}
