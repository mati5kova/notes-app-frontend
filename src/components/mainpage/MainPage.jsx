import { Button } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconPencilPlus } from '@tabler/icons-react';
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
    const [, scrollTo] = useWindowScroll();
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
    const [searchIsDisplayed, setSearchIsDisplayed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [skeletonCount, setSkeletonCount] = useState(0); // State for skeleton count

    useEffect(() => {
        const countFromStorage = parseInt(localStorage.getItem('numberOfNotes')) || 0;
        setSkeletonCount(countFromStorage);
        scrollTo({ y: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const notify = (msg, closes) => {
        toast.error(msg, {
            position: 'top-center',
            autoClose: closes === false ? false : 3500,
            pauseOnHover: false,
        });
    };

    const handleNewNoteClick = () => {
        if (!isAuthenticated) {
            notify('You must login to create a note', true);
            return;
        }
        setOpened((opened) => !opened);
    };

    const fetchPaginatedNotes = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/retrieve-all?page=${pageNumber}&limit=${DEFAULT_LIMIT}`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });
            if (response.ok) {
                const parsedResponse = await response.json();

                if (parsedResponse.length !== DEFAULT_LIMIT) {
                    setNoMoreNotes(true);
                }

                setNotes([...notes, ...parsedResponse]);

                setLoading(false);
                setInitialLoading(false);
            } else if (isAuthenticated === false) {
                setLoading(false);
            } else {
                setLoading(false);
                notify('There was an error fetching notes', false);
                if (import.meta.env.DEV) {
                    console.log('Error, response: ', response);
                }
            }
        } catch (error) {
            setLoading(false);
            if (isAuthenticated !== false) {
                notify('There was an error fetching notes', false);
            }
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    useEffect(() => {
        //da ne moreš scrollat ko si v newnote kreaciji
        document.body.style.overflowY = opened === true ? 'hidden' : 'scroll';
        document.body.style.position = opened === true ? 'fixed' : 'static';
        document.querySelector('.main-container').style.width = opened === true ? '100vw' : '100%';

        return () => {
            document.body.style.overflowY = 'scroll';
            document.body.style.position = 'static';
        };
    }, [opened]);

    useEffect(() => {
        if (noMoreNotes) return;
        if (activeSearch) return;

        fetchPaginatedNotes();

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
            <Header
                setNotes={setNotes}
                setActiveSearch={setActiveSearch}
                setSearchIsDisplayed={setSearchIsDisplayed}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />
            <div className="main-container">
                <div
                    className={`new-button-full-container ${
                        !initialLoading && !loading && notes.length > 0
                            ? 'top-right'
                            : !initialLoading && !loading && notes.length === 0
                            ? 'center'
                            : isAuthenticated === false
                            ? 'center'
                            : loading || initialLoading
                            ? 'top-right'
                            : ''
                    }`}
                >
                    <Button rightSection={<IconPencilPlus stroke={2} width={18} />} pr={12} onClick={handleNewNoteClick}>
                        New note
                    </Button>
                </div>

                {searchIsDisplayed === true && (
                    <a
                        href="#"
                        className="back-button"
                        onClick={() => {
                            setNoMoreNotes(false);
                            setInitialLoading(true);
                            setLoading(false);
                            setActiveSearch(false);
                            setSearchIsDisplayed(false);
                            setNotes([]);
                            setSearchTerm('');
                            setPageNumber(1);
                        }}
                    >
                        &lt;Go back
                    </a>
                )}

                <NewNote opened={opened} setOpened={setOpened} setNotes={setNotes} />

                {isAuthenticated && isAuthenticated === true && initialLoading === false && (
                    <Notes notes={notes} setNotes={setNotes} lastNoteElementRef={lastNoteElementRef} />
                )}

                {loading && !initialLoading && !noMoreNotes && !activeSearch && <span className="loader"></span>}
                {isAuthenticated && loading && initialLoading && renderSkeletonLoaders()}
            </div>
        </main>
    );
}
