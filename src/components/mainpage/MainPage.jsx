import { Button } from '@mantine/core';
import { IconPencilPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App.jsx';
import Header from '../header/Header.jsx';
import NewNote from '../newnote/NewNote.jsx';
import Notes from '../notes/Notes.jsx';
import './mainpage.css';

export default function MainPage() {
    const { isAuthenticated } = useContext(NotesContext);
    const DEFAULT_LIMIT = 12;
    const [opened, setOpened] = useState(false);
    const [notes, setNotes] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [noMoreNotes, setNoMoreNotes] = useState(false);
    //popravi napako da stran fetcha naslednje note ko je rerender zaradi searcha
    const [activeSearch, setActiveSearch] = useState(false);

    const observer = useRef();
    const lastNoteElementRef = useCallback(
        (node) => {
            if (loading) return;
            if (observer.current) {
                observer.current.disconnect();
            }
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    //console.log('visible');
                    setPageNumber((pageNumber) => pageNumber + 1);
                }
            });
            if (node) {
                observer.current.observe(node);
            }
        },
        [loading]
    );

    const notify = () => {
        toast.error('You must login to create a note', {
            position: 'top-center',
            autoClose: 3500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
    };

    const handleNewNoteClick = () => {
        if (!isAuthenticated) {
            notify();
            return;
        }
        setOpened((opened) => !opened);
    };

    useEffect(() => {
        //da ne moreš scrollat ko si v newnote kreaciji
        opened ? (document.body.style.overflowY = 'hidden') : (document.body.style.overflowY = 'scroll');
    }, [opened]);

    useEffect(() => {
        setLoading(true);
        if (noMoreNotes) return;
        if (activeSearch) return;
        axios({
            method: 'GET',
            headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            url: `${import.meta.env.VITE_API_BASE_URL}/notes/retrieve-all?page=${pageNumber}&limit=${DEFAULT_LIMIT}`,
        })
            .then(async (res) => {
                if (res.data && res.data.length > 0) {
                    const jointArray = [...notes, ...res.data];
                    setNotes(Array.from(new Set(jointArray.map(JSON.stringify)), JSON.parse));
                }
                if (res.data.length != DEFAULT_LIMIT) {
                    setNoMoreNotes(true);
                }
                setLoading(false);
            })
            .catch((error) => {
                setLoading(false);
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNumber]);

    return (
        <main>
            <div className={`dimmed-screen ${opened && 'active'}`}></div>
            <Header setNotes={setNotes} setActiveSearch={setActiveSearch} />
            <div className="main-container">
                <div className={`new-button-full-container ${notes.length == 0 && 'center'}`}>
                    <Button rightSection={<IconPencilPlus stroke={2} width={18} />} pr={12} onClick={handleNewNoteClick}>
                        New note
                    </Button>
                </div>
                <NewNote opened={opened} setOpened={setOpened} />

                <Notes notes={notes} lastNoteElementRef={lastNoteElementRef} />
                {loading && !noMoreNotes && !activeSearch && <span className="loader"></span>}
            </div>
        </main>
    );
}
