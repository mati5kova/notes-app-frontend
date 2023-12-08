/* eslint-disable react/prop-types */
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { forwardRef, useEffect, useState } from 'react';
import EditNote from '../editnote/EditNote.jsx';
import Attachment from './Attachment.jsx';
import './notes.css';

const Note = forwardRef(({ setDisplayedNotes, id, title, content, subject, last_update, attachments }, ref) => {
    const [opened, setOpened] = useState(false); //za razširitev nota s klikom
    const [editingNote, setEditingNote] = useState(false); //za editanje nota

    const handleNoteOpenClick = () => {
        setOpened((opened) => !opened);
    };

    const handleNoteEdit = () => {
        setEditingNote((editingNote) => !editingNote);
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
        editingNote ? (document.body.style.overflowY = 'hidden') : (document.body.style.overflowY = 'scroll');
    }, [editingNote]);

    return (
        <>
            <div className={`dimmed-screen ${editingNote && 'active'}`}></div>

            {editingNote && (
                //da ne generiramo edit nota za vse note in da se resetira isDeleted
                <EditNote
                    editingNote={editingNote}
                    setEditingNote={setEditingNote}
                    title={title}
                    subject={subject}
                    content={content}
                    attachments={attachments}
                    id={id}
                />
            )}
            <div className={`note-wrapper ${opened ? 'opened-note' : 'closed-note'} ${attachments && 'slimmer'}`} tabIndex={0} ref={ref}>
                <div className="note-info" onClick={handleNoteOpenClick}>
                    <div className="note-title">
                        <h2>{`${subject !== undefined && subject !== null && subject !== '' ? `[${subject}] ` : ''}${title}`}</h2>
                    </div>
                    <div className="last-update">
                        <small>{last_update}</small>
                    </div>
                </div>
                <div className="note-tools">
                    <IconTrash onClick={() => handleNoteDelete(id)} />
                    <IconEdit onClick={() => handleNoteEdit(id)} />
                </div>
                <div className="note-content">
                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                    {attachments && (
                        <div className="note-attachments">
                            {attachments.map((attachment) => {
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
