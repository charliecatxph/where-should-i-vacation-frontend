import type { AxiosError } from "axios";

export interface WTAError {
  code: string;
  err?: string;
}

export type serverErrorCodes =
  | "SERVER_OFFLINE"
  | "UNEXPECTED_ERROR"
  | "PARAMETERS_INCOMPLETE"
  | "USER_NOT_EXIST"
  | "USER_GENERATION_ID_MISMATCH"
  | "RAN_OUT_OF_CREDITS"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "RECAPTCHA_FAIL";

export function handleAxiosError(error: AxiosError): serverErrorCodes {
  const axiosError = error as AxiosError;

  if (axiosError?.response) {
    const data = axiosError.response.data as WTAError;
    return data.code as serverErrorCodes;
  } else if (axiosError.request) {
    return "SERVER_OFFLINE";
  } else {
    return "UNEXPECTED_ERROR";
  }
}
