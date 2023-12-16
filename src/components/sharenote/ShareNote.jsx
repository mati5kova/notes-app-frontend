/* eslint-disable react/prop-types */
import { Button, Checkbox, CloseButton, TextInput, Tooltip } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import '../newnote/newnote.css';
import './sharenote.css';

export default function ShareNote({ sharingNote, setSharingNote, id }) {
    const [allowEditChecked, setAllowEditChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sharedWith, setSharedWith] = useState([
        /*  { email: 'john.doe123@example.com', editingPermission: true },
        { email: 'susan.smith456@example.com', editingPermission: false },
        { email: 'mike.jones789@example.com', editingPermission: true },
        { email: 'emily.wilson321@example.com', editingPermission: false },
        { email: 'alex.brown654@example.com', editingPermission: true },
        { email: 'james.bond007@example.com', editingPermission: false },
        { email: 'lisa.anderson111@example.com', editingPermission: true },
        { email: 'robert.johnson222@example.com', editingPermission: false },
        { email: 'olivia.parker333@example.com', editingPermission: true },
        { email: 'william.smith444@example.com', editingPermission: false },
        { email: 'hannah.baker555@example.com', editingPermission: true },
        { email: 'michael.taylor666@example.com', editingPermission: false },
        { email: 'sophia.green777@example.com', editingPermission: true },
        { email: 'daniel.hill888@example.com', editingPermission: false },
        { email: 'ava.campbell999@example.com', editingPermission: true }, */
    ]);

    const fetchShareeData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/sharee-data/${id}`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });

            const parsed = await response.json();
            setSharedWith(parsed);
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        fetchShareeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const notifyError = () => {
        toast.error('Failed to share the note', {
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
        initialValues: {
            recipient: '',
            allowEdit: allowEditChecked,
        },

        validate: {
            recipient: isNotEmpty('Recipient is necesarry'),
        },
    });

    const handleModalClose = () => {
        form.reset();
        setAllowEditChecked(false);
        setSharingNote(false);
    };

    const handleEditNoteSubmit = async () => {
        if (form.isValid()) {
            const formData = new FormData();
            formData.append('recipient', form.values.recipient);
            formData.append('editingPermission', allowEditChecked);

            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/share/${id}`, {
                    method: 'POST',
                    headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                    body: formData,
                });

                const parsed = await response.json();
                if (parsed === 'User does not exist') {
                    form.setFieldError('recipient', 'User does not exist');
                } else if (parsed === 'Note does not exist') {
                    notifyError();
                } else if (parsed === 'Failed to execute request') {
                    notifyError();
                } else if (parsed === 'Successfully shared the note') {
                    setSharedWith([...sharedWith, { shared_with_email: form.values.recipient, editing_permission: allowEditChecked }]);
                    form.reset();
                    setAllowEditChecked(false);
                } else if (parsed === 'Already sharing with this user') {
                    form.setFieldError('recipient', 'Already sharing with this user');
                } else {
                    console.log(parsed);
                }
            } catch (error) {
                console.log(error.message);
                notifyError();
            }
        }
    };

    const handlePermissionRemove = async (email) => {
        const formData = new FormData();
        formData.append('sharee', email);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/remove-share/${id}`, {
                method: 'POST',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                body: formData,
            });
            const parsed = await response.json();
            if (parsed === 'Failed to remove permissions') {
                notifyError();
            } else {
                setSharedWith((element) =>
                    element.filter((s) => {
                        return s.shared_with_email !== email;
                    })
                );
            }
        } catch (error) {
            console.log(error.message);
            notifyError();
        }
    };

    return (
        <>
            <div className={`new-note-modal ${sharingNote && 'active sharing'}`}>
                <div className="modal-top-right-controls sharing">
                    <IconX className="controls-icon" onClick={handleModalClose}></IconX>
                </div>
                <h3>Share Note</h3>

                <form onSubmit={form.onSubmit()} className="new-note-modal-form">
                    <TextInput
                        label="Share with"
                        placeholder="user@mail.com"
                        withAsterisk
                        {...form.getInputProps('recipient')}
                        className="new-note-title sharing new-note-form-basic-input"
                        rightSection={
                            <CloseButton
                                onClick={() => form.setFieldValue('recipient', '')}
                                aria-label="Clear input"
                                style={{ display: form.values.recipient ? undefined : 'none' }}
                            />
                        }
                    />

                    <Button type="submit" className="new-note-submit sharing" onClick={handleEditNoteSubmit}>
                        Add
                    </Button>
                    <Checkbox
                        checked={allowEditChecked}
                        className={`allow-edit-checkbox ${allowEditChecked === true ? 'active' : ''}`}
                        label="Give edit permissions"
                        onChange={(event) => setAllowEditChecked(event.currentTarget.checked)}
                    />
                </form>

                {sharedWith.length > 0 && sharedWith && (
                    <div className="sharing-container">
                        <div className="shared-legend">Users with note access: {sharedWith.length}</div>
                        <div className="shared-with">
                            {sharedWith.map((sharee) => {
                                return (
                                    <div className="individual-sharee" key={sharee.shared_with_email}>
                                        <div className="sharee-email">{sharee.shared_with_email}</div>
                                        <div style={{ position: 'relative', top: '3px' }}>
                                            {sharee.editing_permission === true ? (
                                                <Tooltip label="Has editing permissions">
                                                    <IconEdit size={21}></IconEdit>
                                                </Tooltip>
                                            ) : null}

                                            <IconTrash
                                                size={21}
                                                style={{ margin: ' 0 4px 0 8px' }}
                                                onClick={() => handlePermissionRemove(sharee.shared_with_email)}
                                                className="trash-icon-sharing"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}