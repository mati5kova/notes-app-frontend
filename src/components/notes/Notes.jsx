/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from 'react';
import { NotesContext } from '../../App.jsx';
import Note from './Note.jsx';

export default function Notes({ notes, lastNoteElementRef }) {
    const { isAuthenticated } = useContext(NotesContext);

    const [displayedNotes, setDisplayedNotes] = useState(notes);

    useEffect(() => {
        setDisplayedNotes(notes);
    }, [notes]);

    useEffect(() => {
        //v local storage da število zapiskov kolikor jih je da vemo za drugič koliko skeletonov prikazat
        if (notes.length > 12) {
            localStorage.setItem('numberOfNotes', 12);
        } else {
            localStorage.setItem('numberOfNotes', displayedNotes.length);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {isAuthenticated &&
                displayedNotes.map((note, index) => {
                    {
                        //-1(najmn kot loh das) pri notes.length je da se observer pojavi eno bolj gor da je bolj seamless
                        if (notes.length - 4 === index) {
                            return (
                                <Note
                                    ref={lastNoteElementRef}
                                    setDisplayedNotes={setDisplayedNotes}
                                    key={String(note.note_id)}
                                    id={note.note_id}
                                    title={note.title}
                                    content={note.content}
                                    subject={note.subject}
                                    last_update={note.last_update}
                                    attachments={note.attachments ? note.attachments : null}
                                    editing_permission={note.editing_permission}
                                    shared_by_email={note.shared_by_email}
                                ></Note>
                            );
                        } else {
                            return (
                                <Note
                                    setDisplayedNotes={setDisplayedNotes}
                                    key={String(note.note_id)}
                                    id={note.note_id}
                                    title={note.title}
                                    content={note.content}
                                    subject={note.subject}
                                    last_update={note.last_update}
                                    attachments={note.attachments ? note.attachments : null}
                                    editing_permission={note.editing_permission}
                                    shared_by_email={note.shared_by_email}
                                ></Note>
                            );
                        }
                    }
                })}
        </>
    );
}
