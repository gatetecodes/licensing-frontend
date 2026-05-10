import { Modal } from "antd";
import { useEffect, useState } from "react";

interface FileViewModalProps {
  open: boolean;
  onClose: () => void;
  fileBlob: Blob | null;
  title?: string;
}

export const FileViewModal = ({
  open,
  onClose,
  fileBlob,
  title = "View Document",
}: FileViewModalProps) => {
  const [fileUrl, setFileBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (fileBlob) {
      const url = URL.createObjectURL(fileBlob);
      Promise.resolve().then(() => {
        if (isMounted) {
          setFileBlobUrl(url);
        }
      });
      return () => {
        isMounted = false;
        URL.revokeObjectURL(url);
      };
    } else {
      Promise.resolve().then(() => {
        if (isMounted) {
          setFileBlobUrl(null);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [fileBlob]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width="70vw"
      styles={{
        body: {
          height: "80vh",
          padding: 0,
          overflow: "hidden",
        },
      }}
      destroyOnClose
    >
      {fileUrl ? (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          width="100%"
          height="100%"
          title={title}
          style={{ border: "none" }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading document...</p>
        </div>
      )}
    </Modal>
  );
};
