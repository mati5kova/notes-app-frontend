import { Affix, Button, Transition, rem } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconArrowUp, IconPencilPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App.jsx';
import Header from '../header/Header.jsx';
import NewNote from '../newnote/NewNote.jsx';
import Notes from '../notes/Notes.jsx';
import './mainpage.css';

export default function MainPage() {
    const [scroll, scrollTo] = useWindowScroll();
    const { isAuthenticated } = useContext(NotesContext);
    const DEFAULT_LIMIT = 12;
    const [opened, setOpened] = useState(false);
    const [notes, setNotes] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    //true na začetku da se useEffect v Notes ne sproži zaradi rendera
    const [loading, setLoading] = useState(true);
    const [noMoreNotes, setNoMoreNotes] = useState(false);
    //popravi napako da stran fetcha naslednje note ko je rerender zaradi searcha
    const [activeSearch, setActiveSearch] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [skeletonCount, setSkeletonCount] = useState(0); // State for skeleton count

    useEffect(() => {
        const countFromStorage = parseInt(localStorage.getItem('numberOfNotes')) || 0;
        setSkeletonCount(countFromStorage);
    }, []);

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
        if (noMoreNotes) return;
        if (activeSearch) return;
        setLoading(true);

        axios({
            method: 'GET',
            headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            url: `${import.meta.env.VITE_API_BASE_URL}/notes/retrieve-all?page=${pageNumber}&limit=${DEFAULT_LIMIT}`,
        })
            .then(async (res) => {
                if (res.data && res.data.length > 0) {
                    setNotes([...notes, ...res.data]);
                }
                if (res.data.length != DEFAULT_LIMIT) {
                    setNoMoreNotes(true);
                }
                setLoading(false);
                setInitialLoading(false);
            })
            .catch((error) => {
                setLoading(false);
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNumber]);

    const renderSkeletonLoaders = () => {
        const skeletonLoaders = [];
        for (let i = 0; i < skeletonCount; i++) {
            skeletonLoaders.push(
                <div className="note-wrapper-skeleton" key={i}>
                    <Skeleton style={{ height: '100%', position: 'relative', bottom: '4px' }}></Skeleton>
                </div>
            );
        }
        return skeletonLoaders;
    };

    return (
        <main>
            <div className={`dimmed-screen ${opened && 'active'}`}></div>
            <Header setNotes={setNotes} setActiveSearch={setActiveSearch} />
            <div className="main-container">
                <div className={`new-button-full-container ${notes.length === 0 && 'center'}`}>
                    <Button rightSection={<IconPencilPlus stroke={2} width={18} />} pr={12} onClick={handleNewNoteClick}>
                        New note
                    </Button>
                </div>
                <NewNote opened={opened} setOpened={setOpened} setNotes={setNotes} />
                {isAuthenticated && isAuthenticated === true && initialLoading === false && (
                    <Notes notes={notes} setNotes={setNotes} lastNoteElementRef={lastNoteElementRef} />
                )}

                {loading && !initialLoading && !noMoreNotes && !activeSearch && <span className="loader"></span>}
                {loading && initialLoading && renderSkeletonLoaders()}
            </div>
            <Affix position={{ bottom: 20, right: 20 }} style={{ zIndex: 50 }}>
                <Transition transition="slide-up" mounted={scroll.y > 0}>
                    {(transitionStyles) => (
                        <Button
                            leftSection={<IconArrowUp style={{ width: rem(16), height: rem(16) }} />}
                            style={transitionStyles}
                            onClick={() => scrollTo({ y: 0 })}
                        >
                            Scroll to top
                        </Button>
                    )}
                </Transition>
            </Affix>
        </main>
    );
}
