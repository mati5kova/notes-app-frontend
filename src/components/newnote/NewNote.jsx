/* eslint-disable react/prop-types */
import { Button, FileInput, LoadingOverlay, TextInput } from '@mantine/core';
import { hasLength, isNotEmpty, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { RichTextEditor } from '@mantine/tiptap';
import { IconMaximize, IconMinimize, IconX } from '@tabler/icons-react';
import HardBreak from '@tiptap/extension-hard-break';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import './newnote.css';

export default function NewNote({ opened, setOpened, setNotes }) {
    const initialContent = '<p>NEW NOTE</p>';
    const [visible, { open, close }] = useDisclosure(false);
    const [maximized, setMaximized] = useState(false);
    const [attached, setAttached] = useState([]);

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
    };

    const handleSizeChange = () => {
        setMaximized((maximized) => !maximized);
    };

    const formCleanUp = () => {
        setMaximized(false);
        setOpened(false);
        close();
        form.reset();
        editor.commands.setContent(initialContent);
    };

    const handleModalClose = () => {
        formCleanUp();
    };

    const focusFunction = () => {
        if (!editor.isFocused) {
            editor.commands.focus('end');
        }
    };

    const handleNewNoteSubmit = async () => {
        if (form.isValid()) {
            open();
            const formData = new FormData();
            formData.append('title', form.values.title);
            formData.append('subject', form.values.subject);
            formData.append('content', form.values.content);
            form.values.attachments.forEach((file) => {
                formData.append('attachments', file);
            });
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/new-note`, {
                    method: 'POST',
                    headers: { 'jwt-token': sessionStorage.getItem('jwt-token') },
                    body: formData,
                });

                if (response.ok) {
                    const parsed = await response.json();
                    if (parsed.msg === 'File(s) too large') {
                        close();
                        form.setFieldError('attachments', 'File(s) too large (limit: 100MB)');
                    } else if (parsed.msg === 'Finished uploading') {
                        setNotes((notes) => [parsed.createdNote, ...notes]);
                        handleModalClose();
                    } else if (parsed.msg === 'Failed to create the note') {
                        close();
                        notifyError();
                    } else if (parsed.msg === 'Failed to upload attachments') {
                        close();
                        notifyError();
                        form.setFieldError('attachments', 'Failed to upload attachments');
                    } else {
                        close();
                        notifyError();
                        if (import.meta.env.DEV) {
                            console.log('Something went wrong');
                        }
                    }
                } else {
                    close();
                    notifyError();
                    if (import.meta.env.DEV) {
                        console.log('Something went wrong');
                    }
                }
            } catch (error) {
                close();
                notifyError();
                if (import.meta.env.DEV) {
                    console.log(error.message);
                }
            }
        }
    };

    const form = useForm({
        initialValues: {
            title: '',
            subject: '',
            content: initialContent,
            attachments: [],
        },

        validate: {
            title: isNotEmpty("Title can't be empty"),
            attachments: hasLength({ max: 5 }, 'Maximum of 5 attachments'),
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Superscript,
            SubScript,
            Highlight,
            HardBreak.extend({
                addKeyboardShortcuts() {
                    return {
                        Enter: () => {
                            this.editor.chain().createParagraphNear().run();
                        },
                    };
                },
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            form.setFieldValue('content', html);
        },
    });

    return (
        <>
            <div className={`new-note-modal ${opened && 'active'} ${maximized && 'maximized'}`}>
                <LoadingOverlay
                    visible={visible}
                    zIndex={99999}
                    overlayProps={{ radius: 'sm', blur: '1' }}
                    loaderProps={{ children: <div className="dot-flashing"></div> }}
                />
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
                        placeholder="displayed as [subject] title"
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
                        <RichTextEditor editor={editor} onClick={focusFunction} style={{ zIndex: '101' }}>
                            <RichTextEditor.Toolbar sticky stickyOffset={60} className="rich-editor-toolbar">
                                <RichTextEditor.ControlsGroup className="toolbar-spacing">
                                    <RichTextEditor.Bold />
                                    <RichTextEditor.Italic />
                                    <RichTextEditor.Underline />
                                    <RichTextEditor.Strikethrough />
                                    <RichTextEditor.ClearFormatting />
                                    <RichTextEditor.Highlight />
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
                            </RichTextEditor.Toolbar>

                            {editor && (
                                <BubbleMenu editor={editor}>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Bold />
                                        <RichTextEditor.Italic />
                                    </RichTextEditor.ControlsGroup>
                                </BubbleMenu>
                            )}

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
