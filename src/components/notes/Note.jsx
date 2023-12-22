/* eslint-disable react/prop-types */
import { IconEdit, IconShare3, IconTrash } from '@tabler/icons-react';
import { forwardRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import EditNote from '../editnote/EditNote.jsx';
import ShareNote from '../sharenote/ShareNote.jsx';
import Attachment from './Attachment.jsx';
import './notes.css';
const socket = io.connect(import.meta.env.VITE_API_BASE_URL);

const Note = forwardRef(({ setDisplayedNotes, id, title, content, subject, last_update, attachments, editing_permission, shared_by_email }, ref) => {
    //0: owner        1: lahko vidi       2:lahko edita
    const [opened, setOpened] = useState(false); //za razširitev nota s klikom
    const [editingNote, setEditingNote] = useState(false); //za editanje nota
    const [sharingNote, setSharingNote] = useState(false); //true -> edit note je odprt
    const [isShared, setIsShared] = useState(false);

    const [SlastUpdate, setSlastUpdate] = useState(last_update);
    const [Stitle, setStitle] = useState(title);
    const [Ssubject, setSsubject] = useState(subject);
    const [Scontent, setScontent] = useState(content);
    const [Sattachments, setSattachments] = useState(attachments);

    const handleNoteOpenClick = () => {
        setOpened((opened) => !opened);
    };

    const handleNoteEdit = () => {
        setEditingNote((editingNote) => !editingNote);
    };

    const handleSharingNote = () => {
        setSharingNote((sharingNote) => !sharingNote);
    };

    const handleNoteDelete = async (id) => {
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/delete-note/${id}`, {
                method: 'DELETE',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });
            setDisplayedNotes((dNotes) =>
                dNotes.filter((note) => {
                    return note.note_id !== id;
                })
            );
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    useEffect(() => {
        //da ne moreš scrollat ko editas note
        editingNote === true || sharingNote === true ? (document.body.style.overflowY = 'hidden') : (document.body.style.overflowY = 'scroll');
    }, [editingNote, sharingNote]);

    useEffect(() => {
        if ((shared_by_email && shared_by_email !== null) || isShared) {
            socket.on(`note_${id}_updated`, async (noteId) => {
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
                    }
                } catch (error) {
                    console.log(error.message);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShared]);

    return (
        <>
            {(editingNote || sharingNote) && <div className={`dimmed-screen ${editingNote && 'active'} ${sharingNote && 'active'}`}></div>}

            {/* opened je dodan zato da se api klic za sharee-je kliče samo če se note odpre in da že čakajo podatki */}
            <ShareNote sharingNote={sharingNote} setSharingNote={setSharingNote} id={id} setIsShared={setIsShared} />
            {(editing_permission === 0 || editing_permission === 2) && editingNote && (
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
                />
            )}

            <div className={`note-wrapper ${opened ? 'opened-note' : 'closed-note'} ${Sattachments && 'slimmer'}`} tabIndex={0} ref={ref}>
                <div className="note-info" onClick={handleNoteOpenClick}>
                    <div className="note-title">
                        <h2>{`${Ssubject !== undefined && Ssubject !== null && Ssubject !== '' ? `[${Ssubject}] ` : ''}${Stitle}`}</h2>
                    </div>
                    <div className="last-update">
                        <small>{SlastUpdate}</small>
                    </div>
                </div>
                <div className="sharee-tools-row">
                    <div className="sharee-user-div">{shared_by_email !== null && `Shared by: ${shared_by_email}`}</div>
                    {editing_permission === 0 && (
                        //če je lastnik lahko vse
                        <div className="note-tools">
                            <IconTrash onClick={() => handleNoteDelete(id)} />
                            <IconShare3 onClick={() => handleSharingNote(id)} />
                            <IconEdit onClick={() => handleNoteEdit(id)} />
                        </div>
                    )}
                    {editing_permission === 2 && (
                        <div className="note-tools">
                            <IconEdit onClick={() => handleNoteEdit(id)} />
                        </div>
                    )}
                </div>

                <div className="note-content">
                    <div dangerouslySetInnerHTML={{ __html: Scontent }}></div>
                    {Sattachments && (
                        <div className="note-attachments">
                            {Sattachments.map((attachment) => {
                                return (
                                    <Attachment
                                        key={attachment.attachment_id}
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
});
Note.displayName = 'Note';
export default Note;
