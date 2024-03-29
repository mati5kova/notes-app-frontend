/* eslint-disable react/prop-types */
import { Button, Checkbox, CloseButton, TextInput, Tooltip } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import '../newnote/newnote.css';
import './sharenote.css';

export default function ShareNote({ sharingNote, setSharingNote, id, setIsShared, socket }) {
    const [allowEditChecked, setAllowEditChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sharedWith, setSharedWith] = useState([]);

    const fetchShareeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/sharee-data/${id}`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });

            const parsed = await response.json();
            setSharedWith(parsed);
            if (parsed.length > 0) {
                setIsShared(true);
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        } finally {
            setLoading(false);
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

    const handleShareNoteSubmit = async () => {
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
                } else if (parsed === "You can't share note with yourself") {
                    form.setFieldError('recipient', "You can't share note with yourself");
                } else if (parsed === 'Successfully shared the note') {
                    setSharedWith([...sharedWith, { shared_with_email: form.values.recipient, editing_permission: allowEditChecked }]);
                    setIsShared(true);
                    socket.emit('note_shared', { user_email: form.values.recipient, noteId: id, token: sessionStorage.getItem('jwt-token') });
                    form.reset();
                    setAllowEditChecked(false);
                } else if (parsed === 'Updated existing permission') {
                    setSharedWith((shrdw) => {
                        const updatedItemIndex = shrdw.findIndex((shr) => shr.shared_with_email === form.values.recipient);

                        if (updatedItemIndex !== -1) {
                            const updatedItem = shrdw[updatedItemIndex];
                            const updatedPermission = updatedItem.editing_permission === 2 ? 1 : 2;

                            const updatedArray = [
                                { shared_with_email: form.values.recipient, editing_permission: updatedPermission },
                                ...shrdw.slice(0, updatedItemIndex),
                                ...shrdw.slice(updatedItemIndex + 1),
                            ];

                            socket.emit('note_shared_permission_change', {
                                user_email: form.values.recipient,
                                noteId: id,
                                editing_permission: updatedPermission,
                                token: sessionStorage.getItem('jwt-token'),
                            });
                            return updatedArray;
                        }

                        return shrdw;
                    });
                    form.reset();
                    setAllowEditChecked(false);
                } else if (parsed === 'No change') {
                    setSharedWith((shrdw) => {
                        const updatedItemIndex = shrdw.findIndex((shr) => shr.shared_with_email === form.values.recipient);
                        if (updatedItemIndex !== -1) {
                            return [shrdw[updatedItemIndex], ...shrdw.slice(0, updatedItemIndex), ...shrdw.slice(updatedItemIndex + 1)];
                        }
                        return shrdw;
                    });
                    setIsShared(true);
                    form.reset();
                    setAllowEditChecked(false);
                    //postavi ga na prvo mesto
                } else {
                    if (import.meta.env.DEV) {
                        console.log('Something went wrong');
                    }
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
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
                socket.emit('share_removed', { user_email: email, noteId: id, token: sessionStorage.getItem('jwt-token') });
                setSharedWith((element) =>
                    element.filter((s) => {
                        return s.shared_with_email !== email;
                    })
                );
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
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

                    <Checkbox
                        checked={allowEditChecked}
                        className={`allow-edit-checkbox ${allowEditChecked === true ? 'active' : ''}`}
                        label="Give edit permissions"
                        onChange={(event) => setAllowEditChecked(event.currentTarget.checked)}
                    />

                    <Button type="submit" className="new-note-submit sharing" onClick={handleShareNoteSubmit}>
                        Add
                    </Button>
                </form>

                <div className="sharing-container">
                    <div className="sharee-loading-spinner" style={{ display: loading ? 'block' : 'none' }}>
                        <span className="sharee-loader"></span>
                    </div>
                    {sharedWith.length > 0 && sharedWith && (
                        <>
                            <div className="shared-legend">Users with note access: {sharedWith.length}</div>
                            <div className="shared-with">
                                {sharedWith.map((sharee) => {
                                    return (
                                        <div className="individual-sharee" key={sharee.shared_with_email}>
                                            <div className="sharee-email" onClick={() => form.setFieldValue('recipient', sharee.shared_with_email)}>
                                                <p style={{ cursor: 'pointer', width: 'min-content' }}>{sharee.shared_with_email}</p>
                                            </div>
                                            <div style={{ position: 'relative', top: '3px' }}>
                                                {sharee.editing_permission === 2 ? (
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
