/* eslint-disable react/prop-types */
import { Button, FileInput, TextInput } from '@mantine/core';
import '@mantine/dates/styles.css';
import { hasLength, isNotEmpty, useForm } from '@mantine/form';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconMaximize, IconMinimize, IconX } from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import './newnote.css';

const initialContent = '<p>NEW NOTE</p>';

export default function NewNote({ opened, setOpened }) {
    const [maximized, setMaximized] = useState(false);
    const [attached, setAttached] = useState([]);
    const [finishedUploading, setFinishedUploading] = useState(true);

    const notifyError = () => {
        toast.error('Failed to create a note', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
        setFinishedUploading(true);
    };

    const handleSizeChange = () => {
        setMaximized((maximized) => !maximized);
    };

    const formCleanUp = () => {
        setMaximized(false);
        setOpened(false);

        form.reset();
        //setEditorContent(initialContent);
        editor.commands.setContent(initialContent);
    };

    const handleModalClose = () => {
        formCleanUp();
    };

    const handleNewNoteSubmit = async () => {
        if (form.isValid()) {
            setFinishedUploading(false);
            const formData = new FormData();
            formData.append('title', form.values.title);
            formData.append('subject', form.values.subject);
            formData.append('content', form.values.content);
            form.values.attachments.forEach((file) => {
                formData.append('attachments', file);
            });

            try {
                let response;
                if (form.values.attachments.length > 0) {
                    response = await toast.promise(
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/new-note`, {
                            method: 'POST',
                            headers: { 'jwt-token': localStorage.getItem('jwt-token') },
                            body: formData,
                        }),
                        {
                            pending: 'Uploading files...',
                        }
                    );
                } else {
                    response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/new-note`, {
                        method: 'POST',
                        headers: { 'jwt-token': localStorage.getItem('jwt-token') },
                        body: formData,
                    });
                }
                if (response.ok) {
                    const parsed = await response.json();
                    if (parsed === 'File(s) too large') {
                        form.setFieldError('attachments', 'File(s) too large (limit: 100MB)');
                    } else if (parsed === 'Finished uploading') {
                        //setFinishedUploading(true);
                        window.location.reload();
                    } else {
                        console.log('Something went wrong');
                    }
                }
            } catch (error) {
                console.log(error);
                notifyError();
            }
        }
    };

    const form = useForm({
        initialValues: {
            title: '',
            subject: '',
            content: '',
            attachments: [],
        },

        validate: {
            title: isNotEmpty("Title can't be empty"),
            attachments: hasLength({ max: 5 }, 'Maximum of 5 attachments'),
        },
    });

    const editor = useEditor({
        extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight, TextAlign.configure({ types: ['heading', 'paragraph'] })],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            //setEditorContent(html);
            form.setFieldValue('content', html);
        },
        onCreate: () => {
            form.setFieldValue('content', initialContent);
        },
    });

    return (
        <>
            <div className={` ${!finishedUploading && 'non-clickable-overlay'}`}></div>
            <div className={`new-note-modal ${opened && 'active'} ${maximized && 'maximized'}`}>
                <div className="modal-top-right-controls">
                    {maximized ? (
                        <IconMinimize onClick={handleSizeChange} className="controls-icon" />
                    ) : (
                        <IconMaximize onClick={handleSizeChange} className="controls-icon" />
                    )}
                    <IconX className="controls-icon" onClick={handleModalClose}></IconX>
                </div>

                <h3>New Note</h3>

                <form onSubmit={form.onSubmit()} className="new-note-modal-form">
                    <TextInput
                        label="Title"
                        placeholder="title"
                        withAsterisk
                        {...form.getInputProps('title')}
                        className="new-note-title new-note-form-basic-input"
                    />
                    <TextInput
                        label="Subject"
                        placeholder="subject"
                        {...form.getInputProps('subject')}
                        className="new-note-subject new-note-form-basic-input"
                    />

                    <FileInput
                        accept="image/*, .doc, .docx, .pdf, .xls, .xlsx, .txt, .ppt, .pptx, .csv, .mp3, .wav, .rtf, .zip, .mp4, .mov, .avi"
                        className="new-note-attachments new-note-form-basic-input"
                        label="Include attachments"
                        placeholder="attachments (max. 5, max. 100MB)"
                        multiple
                        clearable
                        value={attached}
                        onChange={setAttached}
                        {...form.getInputProps('attachments')}
                    />

                    <div className="rich-editor-container">
                        <RichTextEditor editor={editor}>
                            <RichTextEditor.Toolbar sticky stickyOffset={60} className="rich-editor-toolbar">
                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.Bold />
                                    <RichTextEditor.Italic />
                                    <RichTextEditor.Underline />
                                    <RichTextEditor.Strikethrough />
                                    <RichTextEditor.ClearFormatting />
                                    <RichTextEditor.Highlight />
                                    <RichTextEditor.Code />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.H1 />
                                    <RichTextEditor.H2 />
                                    <RichTextEditor.H3 />
                                    <RichTextEditor.H4 />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.Blockquote />
                                    <RichTextEditor.Hr />
                                    <RichTextEditor.BulletList />
                                    <RichTextEditor.OrderedList />
                                    <RichTextEditor.Subscript />
                                    <RichTextEditor.Superscript />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.Link />
                                    <RichTextEditor.Unlink />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.AlignLeft />
                                    <RichTextEditor.AlignCenter />
                                    <RichTextEditor.AlignJustify />
                                    <RichTextEditor.AlignRight />
                                </RichTextEditor.ControlsGroup>
                            </RichTextEditor.Toolbar>

                            <RichTextEditor.Content className="editor-content"></RichTextEditor.Content>
                        </RichTextEditor>
                    </div>

                    <div className="new-note-finish">
                        <Button onClick={handleModalClose} className="new-note-cancel" variant="filled" color="gray">
                            Cancel
                        </Button>

                        <Button type="submit" className="new-note-submit" onClick={handleNewNoteSubmit} variant={'filled'}>
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
