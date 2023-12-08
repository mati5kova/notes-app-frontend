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
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import '../newnote/newnote.css';
import Attachment from '../notes/Attachment';

export default function EditNote({ editingNote, setEditingNote, title, subject, content, id, attachments }) {
    const [maximized, setMaximized] = useState(false);
    const [attached, setAttached] = useState([]);
    const [finishedUploading, setFinishedUploading] = useState(true);
    const [rteHeight, setRteHeight] = useState('57%');
    const [numberOfFiles, setNumberOfFiles] = useState(0);
    //list arrayov [{file_name, note_id},...]
    const [filesToDelete, setFilesToDelete] = useState([]);

    useEffect(() => {
        if (attachments && attachments.length > 0) {
            //nastavimo koliko filov je da vemo za kasneje ko se odstranjujejo in dodajajo
            setNumberOfFiles(attachments.length);

            if (attachments.some((att) => att.file_original_name.length > 12)) {
                setRteHeight('47.5%');
            } else {
                setRteHeight('52%');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const notifyError = () => {
        toast.error('Failed to edit the note', {
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
        setEditingNote(false);
        form.reset();
        editor.commands.setContent(content);
    };

    const handleModalClose = () => {
        formCleanUp();
    };

    const handleEditNoteSubmit = async () => {
        if (form.isValid()) {
            setFinishedUploading(false);
            const formData = new FormData();
            formData.append('title', form.values.title);
            formData.append('subject', form.values.subject);
            formData.append('content', form.values.content);
            form.values.attachments.forEach((file) => {
                formData.append('attachments', file);
            });

            formData.append('filesToDelete', JSON.stringify(filesToDelete));

            try {
                let response;
                if (filesToDelete.length > 0) {
                    response = await toast.promise(
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/update-note/${id}`, {
                            method: 'PUT',
                            headers: { 'jwt-token': localStorage.getItem('jwt-token') },
                            body: formData,
                        }),
                        {
                            pending: 'Updating note...',
                        }
                    );
                } else {
                    response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes/update-note/${id}`, {
                        method: 'PUT',
                        headers: { 'jwt-token': localStorage.getItem('jwt-token') },
                        body: formData,
                    });
                }
                if (response.ok) {
                    const parsed = await response.json();
                    if (parsed === 'File(s) too large') {
                        form.setFieldError('attachments', 'File(s) too large (limit: 100MB)');
                    } else if (parsed === 'Updated successfully') {
                        window.location.reload();
                    } else if (parsed === 'Error deleting file(s)') {
                        notifyError();
                        console.log('Error deleting file(s)');
                    } else if (parsed === 'Error uploading file(s)') {
                        notifyError();
                        form.setFieldError('attachments', 'Failed to upload file(s)');
                        console.log('Error uploading file(s)');
                    } else {
                        console.log(response);
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
            title: title,
            subject: subject !== undefined && subject !== null ? subject : '',
            content: content,
            attachments: [],
        },

        validate: {
            title: isNotEmpty("Title can't be empty"),
            attachments: hasLength({ max: 5 - numberOfFiles }, 'Maximum of 5 attachments'),
        },
    });

    const editor = useEditor({
        extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight, TextAlign.configure({ types: ['heading', 'paragraph'] })],
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            form.setFieldValue('content', html);
        },
    });

    return (
        <>
            <div className={` ${!finishedUploading && 'non-clickable-overlay'}`}></div>
            <div className={`new-note-modal ${editingNote && 'active'} ${maximized && 'maximized'}`}>
                <div className="modal-top-right-controls">
                    {maximized ? (
                        <IconMinimize onClick={handleSizeChange} className="controls-icon" />
                    ) : (
                        <IconMaximize onClick={handleSizeChange} className="controls-icon" />
                    )}
                    <IconX className="controls-icon" onClick={handleModalClose}></IconX>
                </div>

                <h3>Edit Note</h3>

                <form onSubmit={form.onSubmit()} className="new-note-modal-form">
                    <TextInput
                        label="Title"
                        placeholder="title"
                        withAsterisk
                        {...form.getInputProps('title')}
                        className="new-note-title editing new-note-form-basic-input"
                    />

                    <TextInput
                        label="Subject"
                        placeholder="subject"
                        {...form.getInputProps('subject')}
                        className="new-note-subject editing new-note-form-basic-input"
                    />

                    <FileInput
                        accept="image/*, .doc, .docx, .pdf, .xls, .xlsx, .txt, .ppt, .pptx, .csv, .mp3, .wav, .rtf, .zip, .mp4, .mov, .avi"
                        className="new-note-attachments editing new-note-form-basic-input"
                        label="Include attachments"
                        placeholder="attachments (max. 5, max. 100MB)"
                        multiple
                        clearable
                        value={attached}
                        onChange={setAttached}
                        {...form.getInputProps('attachments')}
                    />
                    {attachments && (
                        <div className="note-attachments-editing">
                            {attachments.map((attachment) => {
                                return (
                                    <Attachment
                                        editingEnv={true}
                                        key={attachment.attachment_id}
                                        url={attachment.url}
                                        file_original_name={attachment.file_original_name}
                                        file_extension={attachment.file_extension}
                                        note_id={id}
                                        file_name={attachment.file_name}
                                        setFilesToDelete={setFilesToDelete}
                                        setNumberOfFiles={setNumberOfFiles}
                                    ></Attachment>
                                );
                            })}
                        </div>
                    )}

                    <RichTextEditor editor={editor} style={{ height: `${rteHeight}`, bottom: '4rem' }} {...form.getInputProps('content')}>
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

                    <div className="new-note-finish">
                        <Button onClick={handleModalClose} className="new-note-cancel" variant="filled" color="gray">
                            Cancel
                        </Button>

                        <Button type="submit" className="new-note-submit" onClick={handleEditNoteSubmit}>
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
