import { ActionIcon, Avatar, Button, Group, Menu, Text, TextInput, rem } from '@mantine/core';
import { IconChevronRight, IconLogout, IconSearch } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { NotesContext } from '../../App';
import useScrollDirection from '../../utils/scrollDirection';
import './header.css';

// eslint-disable-next-line react/prop-types
export default function Header({ setNotes, setActiveSearch, setSearchIsDisplayed, searchTerm, setSearchTerm }) {
    const [userData, setUserData] = useState({});
    const scrollDirection = useScrollDirection();

    const { isAuthenticated, setIsAuthenticated, setUserEmail } = useContext(NotesContext);

    const notify = (msg, type) => {
        switch (type) {
            case 'success':
                toast.success(msg, {
                    position: 'top-right',
                    autoClose: 3000,
                    pauseOnHover: false,
                });
                break;
            case 'info':
                toast.info(msg, {
                    position: 'top-center',
                    autoClose: 5000,
                    pauseOnHover: false,
                });
                break;
            default:
                break;
        }
    };

    const handleFilterSearch = async () => {
        // eslint-disable-next-line react/prop-types
        if (searchTerm.length === 0) return;
        setActiveSearch(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/search-notes?search=${searchTerm}`, {
                method: 'GET',
                headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
            });
            if (response.ok) {
                const parseRes = await response.json();
                if (parseRes === 'No notes found') {
                    notify('No notes found', 'info');
                } else {
                    setSearchIsDisplayed(true);
                    setNotes(parseRes);
                }
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log(error.message);
            }
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('jwt-token');
        setNotes([]);
        notify('Successfully logged out', 'success');
    };

    const getUserInfo = async () => {
        if (isAuthenticated === true) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/info`, {
                    method: 'GET',
                    headers: { 'jwt-token': sessionStorage.getItem('jwt-token'), 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const parseRes = await response.json();
                    setUserData(parseRes);
                    setUserEmail(parseRes.user_email);
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            }
        }
    };

    useEffect(() => {
        getUserInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return (
        <header className={`${scrollDirection === 'down' ? 'down' : 'up'}`}>
            <div className={isAuthenticated ? 'header-title-left' : 'header-title-middle'} tabIndex={0}>
                <h1 onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
                    ONLINE NOTES
                </h1>
            </div>
            {!isAuthenticated ? (
                <div className="header-right-side">
                    <Link to="/login" tabIndex={-1}>
                        <Button variant="default" tabIndex={0}>
                            Log in
                        </Button>
                    </Link>
                    <Link to="/signup" tabIndex={-1}>
                        <Button tabIndex={0}>Sign up</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="filter-search">
                        <TextInput
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            variant="filled"
                            placeholder="Search for notes"
                            rightSection={
                                <ActionIcon size={28} radius="xl" color={'blue'} variant="filled" onClick={handleFilterSearch}>
                                    <IconSearch stroke={1.8} size={18} />
                                </ActionIcon>
                            }
                        />
                    </div>

                    <div className="account-icon">
                        <Menu withArrow width={270} position="bottom" transitionProps={{ transition: 'pop' }} withinPortal trigger="hover">
                            <Menu.Target>
                                <span className="material-symbols-outlined" tabIndex={0}>
                                    account_circle
                                </span>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Link to="/account" style={{ textDecoration: 'none' }}>
                                    <Menu.Item rightSection={<IconChevronRight style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
                                        <Group>
                                            <Avatar />

                                            <div>
                                                <Text fw={500} fz={15}>
                                                    {`${userData.user_firstname} ${userData.user_lastname}`}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {userData.user_email}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Menu.Item>
                                </Link>
                                <Menu.Divider />
                                <Menu.Item
                                    onClick={handleLogout}
                                    color="red"
                                    leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </div>
                </>
            )}
        </header>
    );
}
