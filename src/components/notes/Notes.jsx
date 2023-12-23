/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { NotesContext } from '../../App.jsx';
import Note from './Note.jsx';
let socket = io(import.meta.env.VITE_API_BASE_URL);

export default function Notes({ notes, setNotes, lastNoteElementRef }) {
    const { isAuthenticated, userEmail } = useContext(NotesContext);
    const [displayedNotes, setDisplayedNotes] = useState(notes);

    const notifySharedWithMe = () => {
        toast.success('Note was shared with you!', {
            autoClose: 4000,
            pauseOnHover: true,
            pauseOnFocusLoss: true,
        });
    };

    useEffect(() => {
        setDisplayedNotes(notes);

        //v local storage da število zapiskov kolikor jih je da vemo za drugič koliko skeletonov prikazat
        if (notes.length > 12) {
            localStorage.setItem('numberOfNotes', 12);
        } else {
            localStorage.setItem('numberOfNotes', notes.length);
        }
    }, [notes]);

    useEffect(() => {
        if (isAuthenticated === true) {
            socket.connect();
            /*             socket.on('connect', () => {
                console.log('Socket connected');
            });
            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            }); */

            socket.on(`note_shared_with_${userEmail}`, async (noteId) => {
                try {
                    console.log(noteId);
                    notifySharedWithMe();

                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/individual-note/${noteId}`, {
                        method: 'GET',
                        headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                    });
                    if (response.ok) {
                        const parsed = await response.json();
                        setNotes((notes) => [parsed[0], ...notes]);
                    }
                } catch (error) {
                    console.log(error.message);
                }
            });
        } else {
            if (socket) {
                socket.disconnect();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, userEmail]);

    return (
        <>
            {isAuthenticated === true &&
                displayedNotes.map((note, index) => {
                    {
                        //-1(najmn kot loh das) pri notes.length je da se observer pojavi eno bolj gor da je bolj seamless
                        if (notes.length - 4 === index) {
                            return (
                                <Note
                                    ref={lastNoteElementRef}
                                    setNotes={setNotes}
                                    key={String(note.note_id)}
                                    id={note.note_id}
                                    title={note.title}
                                    content={note.content}
                                    subject={note.subject}
                                    last_update={note.last_update}
                                    attachments={note.attachments ? note.attachments : null}
                                    editing_permission={note.editing_permission}
                                    shared_by_email={note.shared_by_email}
                                    socket={socket}
                                ></Note>
                            );
                        } else {
                            return (
                                <Note
                                    setNotes={setNotes}
                                    key={String(note.note_id)}
                                    id={note.note_id}
                                    title={note.title}
                                    content={note.content}
                                    subject={note.subject}
                                    last_update={note.last_update}
                                    attachments={note.attachments ? note.attachments : null}
                                    editing_permission={note.editing_permission}
                                    shared_by_email={note.shared_by_email}
                                    socket={socket}
                                ></Note>
                            );
                        }
                    }
                })}
        </>
    );
}
