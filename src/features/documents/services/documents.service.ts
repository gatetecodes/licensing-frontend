import { apiClient } from "@/lib/axios";
import { AxiosApiError } from "@/lib/api-error";
import type { IApiSuccessResponse } from "@/types/api.types";
import type {
  DocumentListPayload,
  DocumentUploadPayload,
  DocumentVersionListPayload,
} from "../types/documents.types";

const getData = <T>(response: { data: IApiSuccessResponse<T> }): T => {
  if (!response.data.data) {
    throw new AxiosApiError("API response data is missing", {
      status: response.data.status,
      details: response.data,
    });
  }
  return response.data.data;
};

const getHeaderValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return "";
};

export const documentsService = {
  listByApplication: async (applicationId: string): Promise<DocumentListPayload> =>
    getData(
      await apiClient.get<IApiSuccessResponse<DocumentListPayload>>(
        `/applications/${applicationId}/documents`,
      ),
    ),
  upload: async ({
    applicationId,
    documentType,
    file,
  }: {
    applicationId: string;
    documentType: string;
    file: File;
  }): Promise<DocumentUploadPayload> => {
    if (!(file instanceof File)) {
      throw new AxiosApiError("Invalid file payload. Please choose a PDF again.");
    }

    if (file.size === 0) {
      throw new AxiosApiError("Selected file is empty. Please choose another PDF.");
    }

    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file, file.name);

    return getData(
      await apiClient.post<IApiSuccessResponse<DocumentUploadPayload>>(
        `/applications/${applicationId}/documents`,
        formData,
      ),
    );
  },
  listVersions: async (documentId: string): Promise<DocumentVersionListPayload> =>
    getData(
      await apiClient.get<IApiSuccessResponse<DocumentVersionListPayload>>(
        `/documents/${documentId}/versions`,
      ),
    ),
  downloadVersion: async (
    versionId: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get<Blob>(
      `/document-versions/${versionId}/download`,
      {
        responseType: "blob",
      },
    );

    const contentType = getHeaderValue(response.headers["content-type"]).toLowerCase();
    if (contentType.includes("application/json")) {
      let message = "Failed to download document.";
      try {
        const text = await response.data.text();
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed?.message) {
          message = parsed.message;
        }
      } catch {
        // ignore parse failures and keep default message
      }
      throw new AxiosApiError(message, {
        status: response.status,
      });
    }

    const contentDisposition = getHeaderValue(response.headers["content-disposition"]);
    const filenameMatch = contentDisposition.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)/i,
    );
    const filename = filenameMatch?.[1]
      ? decodeURIComponent(filenameMatch[1].replace(/"/g, "").trim())
      : `document-${versionId}.pdf`;

    return { blob: response.data, filename };
  },
};
