/* eslint-disable react/prop-types */
import { IconEdit, IconShare3, IconTrash } from '@tabler/icons-react';
import { forwardRef, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App.jsx';
import EditNote from '../editnote/EditNote.jsx';
import ShareNote from '../sharenote/ShareNote.jsx';
import Attachment from './Attachment.jsx';
import './notes.css';

const Note = forwardRef(
    ({ setNotes, id, title, content, subject, last_update, attachments, editing_permission, shared_by_email, socket, shouldAnimate }, ref) => {
        //0: owner        1: lahko vidi       2:lahko edita
        const [opened, setOpened] = useState(false); //za razširitev nota s klikom
        const [editingNote, setEditingNote] = useState(false); //za editanje nota
        const [sharingNote, setSharingNote] = useState(false); //true -> edit note je odprt
        const [isShared, setIsShared] = useState(false);

        const [shouldPulse, setShouldPulse] = useState(shouldAnimate);

        const [SlastUpdate, setSlastUpdate] = useState(last_update);
        const [Stitle, setStitle] = useState(title);
        const [Ssubject, setSsubject] = useState(subject);
        const [Scontent, setScontent] = useState(content);
        const [Sattachments, setSattachments] = useState(attachments);
        const [Sediting_permission, setSediting_permission] = useState(editing_permission);

        const { userEmail } = useContext(NotesContext);

        const notify = (msg) => {
            toast.error(msg, {
                position: 'top-right',
                autoClose: 5000,
                closeOnClick: true,
                pauseOnHover: true,
            });
        };

        const handleNoteOpenClick = () => {
            setOpened((opened) => !opened);
            setShouldPulse(false);
        };

        const handleNoteEdit = () => {
            setEditingNote((editingNote) => !editingNote);
        };

        const handleSharingNote = () => {
            setSharingNote((sharingNote) => !sharingNote);
        };

        const handleNoteDelete = async (id) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/delete-note/${id}`, {
                    method: 'DELETE',
                    headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                });
                if (response.ok) {
                    const parsed = await response.json();
                    if (parsed === 'Deleted note') {
                        socket.emit('note_deleted', { noteId: id });
                        setNotes((dNotes) =>
                            dNotes.filter((note) => {
                                return note.note_id !== id;
                            })
                        );
                    } else {
                        notify('Error deleting note');
                    }
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            }
        };

        useEffect(() => {
            // da ne moreš scrollat ko ...
            document.body.style.overflowY = editingNote || sharingNote ? 'hidden' : 'scroll';
            return () => {
                document.body.style.overflowY = 'scroll';
            };
        }, [editingNote, sharingNote]);

        useEffect(() => {
            if ((shared_by_email && shared_by_email !== null) || isShared) {
                const deletedSharedNoteHandler = (noteId) => {
                    notify('A note shared with you was recently deleted');
                    setNotes((notes) => {
                        return notes.filter((note) => {
                            return note.note_id !== noteId;
                        });
                    });
                };

                const sharedNoteUpdatedHandler = async (noteId) => {
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/individual-note/${noteId}`, {
                            method: 'GET',
                            headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                        });
                        const parsed = await response.json();
                        if (response.ok) {
                            setStitle(parsed[0].title);
                            setSsubject(parsed[0].subject);
                            setScontent(parsed[0].content);
                            setSlastUpdate(parsed[0].last_update);
                            setSattachments(parsed[0].attachments);

                            if (shared_by_email && shared_by_email !== null) {
                                setShouldPulse('always-blue');
                            } else {
                                setShouldPulse('always-gray');
                            }
                        }
                    } catch (error) {
                        if (import.meta.env.DEV) {
                            console.log(error.message);
                        }
                    }
                };

                const handlePermissionChange = async (ep) => {
                    try {
                        setSediting_permission(ep);
                    } catch (error) {
                        if (import.meta.env.DEV) {
                            console.log(error.message);
                        }
                    }
                };

                socket.on(`note_${id}_updated`, sharedNoteUpdatedHandler);
                socket.on(`note_${id}_deleted`, deletedSharedNoteHandler);
                socket.on(`note_shared_permission_change_${id}_${userEmail}`, handlePermissionChange);
                return () => {
                    socket.off(`note_${id}_updated`, sharedNoteUpdatedHandler);
                    socket.off(`note_${id}_deleted`, deletedSharedNoteHandler);
                    socket.off(`note_shared_permission_change_${id}_${userEmail}`, handlePermissionChange);
                };
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isShared, opened, shouldPulse]);

        return (
            <>
                {(editingNote || sharingNote) && <div className={`dimmed-screen ${editingNote && 'active'} ${sharingNote && 'active'}`}></div>}

                {/* opened je dodan zato da se api klic za sharee-je kliče samo če se note odpre in da že čakajo podatki */}
                <ShareNote sharingNote={sharingNote} setSharingNote={setSharingNote} id={id} setIsShared={setIsShared} socket={socket} />
                {(Sediting_permission === 0 || Sediting_permission === 2) && editingNote && (
                    //da ne generiramo edit nota za vse note in da se resetira isDeleted
                    <EditNote
                        editingNote={editingNote}
                        setEditingNote={setEditingNote}
                        title={Stitle}
                        subject={Ssubject}
                        content={Scontent}
                        attachments={Sattachments}
                        id={id}
                        socket={socket}
                        setTitle={setStitle}
                        setSubject={setSsubject}
                        setContent={setScontent}
                        setAttachments={setSattachments}
                        setLastUpdate={setSlastUpdate}
                        setShouldPulse={setShouldPulse}
                    />
                )}

                <div
                    className={`note-wrapper ${opened ? 'opened-note' : 'closed-note'} ${Sattachments && 'slimmer'} ${
                        shared_by_email !== null && 'is-shared-not-mine'
                    } ${
                        shouldPulse === 'always-blue'
                            ? 'pulsing-anim-blue'
                            : shouldPulse === 'temporary-gray'
                            ? 'pulsing-anim-gray-limited'
                            : shouldPulse === 'always-gray'
                            ? 'pulsing-anim-gray'
                            : ''
                    }`}
                    tabIndex={0}
                    ref={ref}
                    onMouseOver={() => {
                        if (opened) {
                            setShouldPulse('never');
                        }
                    }}
                >
                    <div className="note-info" onClick={handleNoteOpenClick}>
                        <div className="note-title">
                            <h2>{`${Ssubject !== undefined && Ssubject !== null && Ssubject !== '' ? `[${Ssubject}] ` : ''}${Stitle}`}</h2>
                        </div>
                        <div className="last-update">
                            <small>{SlastUpdate}</small>
                        </div>
                    </div>
                    <div className="sharee-tools-row">
                        <div className="sharee-user-div">{shared_by_email && `Shared by: ${shared_by_email}`}</div>
                        {Sediting_permission === 0 && (
                            //če je lastnik lahko vse
                            <div className="note-tools">
                                <IconTrash onClick={() => handleNoteDelete(id)} />
                                <IconShare3 onClick={() => handleSharingNote(id)} />
                                <IconEdit onClick={() => handleNoteEdit(id)} />
                            </div>
                        )}
                        {Sediting_permission === 2 && (
                            <div className="note-tools">
                                <IconEdit onClick={() => handleNoteEdit(id)} />
                            </div>
                        )}
                    </div>

                    <div className="note-content">
                        <div dangerouslySetInnerHTML={{ __html: Scontent }}></div>
                        {Sattachments && Sattachments.length > 0 && (
                            <div className="note-attachments">
                                {Sattachments.map((attachment, index) => {
                                    return (
                                        <Attachment
                                            key={index}
                                            url={attachment.url}
                                            note_id={id}
                                            file_name={attachment.file_name}
                                            file_original_name={attachment.file_original_name}
                                            file_extension={attachment.file_extension}
                                        ></Attachment>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }
);
Note.displayName = 'Note';
export default Note;
