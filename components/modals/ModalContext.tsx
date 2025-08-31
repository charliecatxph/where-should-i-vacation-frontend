import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalType = "parameterError" | "creditError" | "serverError" | null;

interface ModalContextType {
  openModal: ModalType;
  showParameterError: () => void;
  showCreditError: () => void;
  showServerError: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [openModal, setOpenModal] = useState<ModalType>(null);

  const showParameterError = () => setOpenModal("parameterError");
  const showCreditError = () => setOpenModal("creditError");
  const showServerError = () => setOpenModal("serverError");
  const closeModal = () => setOpenModal(null);

  return (
    <ModalContext.Provider
      value={{
        openModal,
        showParameterError,
        showCreditError,
        showServerError,
        closeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
