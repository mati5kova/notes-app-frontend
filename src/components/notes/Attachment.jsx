/* eslint-disable react/prop-types */
import {
    IconFile,
    IconFileMusic,
    IconFileTypeCsv,
    IconFileTypeDoc,
    IconFileTypeDocx,
    IconFileTypeJpg,
    IconFileTypePdf,
    IconFileTypePng,
    IconFileTypePpt,
    IconFileTypeTxt,
    IconFileTypeXls,
    IconFileTypeZip,
    IconMovie,
    IconXboxX,
} from '@tabler/icons-react';
import { useState } from 'react';

const fileIcons = {
    doc: IconFileTypeDoc,
    docx: IconFileTypeDocx,
    pdf: IconFileTypePdf,
    xls: IconFileTypeXls,
    xlsx: IconFileTypeXls,
    txt: IconFileTypeTxt,
    rtf: IconFileTypeTxt,
    ppt: IconFileTypePpt,
    pptx: IconFileTypePpt,
    csv: IconFileTypeCsv,
    mp3: IconFileMusic,
    wav: IconFileMusic,
    zip: IconFileTypeZip,
    jpg: IconFileTypeJpg,
    jpeg: IconFileTypeJpg,
    png: IconFileTypePng,
    mp4: IconMovie,
    mov: IconMovie,
    avi: IconMovie,
};

export default function Attachment({ url, note_id, file_name, file_original_name, file_extension, editingEnv, setFilesToDelete, setNumberOfFiles }) {
    const FileIcon = fileIcons[file_extension.toLowerCase()] || IconFile;
    const [isDeleted, setIsDeleted] = useState(false);

    const handleAttachmentDelete = () => {
        setFilesToDelete((filesToDelete) => {
            return [...filesToDelete, { file_name, note_id }];
        });
        setIsDeleted(true);
        setNumberOfFiles((num) => num - 1);
    };

    return (
        <>
            <div className={`attachments ${editingEnv === true ? 'editing' : ''} ${isDeleted === true ? 'deleted' : ''} `}>
                {editingEnv === true ? (
                    <div className={``}>
                        <div className="attachment-icons">
                            <IconXboxX stroke="1.8" size="20" className="attachment-delete-mark" onClick={() => handleAttachmentDelete()} />
                            <FileIcon size="35" stroke="1.2" color="black" />
                        </div>
                        <div className="attachment-name">{file_original_name}</div>
                    </div>
                ) : (
                    <>
                        <a target="_blank" href={url} rel="noreferrer" title={file_original_name}>
                            <FileIcon size="35" stroke="1.2" color="black"></FileIcon>
                        </a>
                        <div className="attachment-name" style={{ position: 'relative', bottom: '0.3rem' }}>
                            {file_original_name}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
