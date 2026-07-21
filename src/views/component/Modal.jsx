import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import Icon from "@/components/ui/Icon";

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "",
  title = "Basic Modal",
  subTitle, // <-- THÊM PROP NÀY
  bodyMaxHeight = null,
  uncontrol,
  label = "Basic Modal",
  labelClass,
  hideHeader = false,
  hideClose = false,
  background = "#F7F7F7",
  showDivider = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => setShowModal(false);
  const openModal = () => setShowModal(!showModal);
  const returnNull = () => null;

  const renderContent = (handleClose) => (
    <Dialog.Panel
      className={`w-full transform overflow-hidden rounded-md
      text-left align-middle shadow-xl transition-all ${className}`}
      style={{ background }}>
      {!hideHeader && (
        <div
          className={`relative overflow-hidden py-4 px-5 flex flex-col gap-1 justify-between
          ${showDivider ? "border-b border-slate-200 dark:border-slate-700" : ""}
          ${themeClass}`}>
          <div className="flex justify-between items-start">
            <h2 className="capitalize tracking-wider font-semibold text-lg md:text-xl leading-6 md:leading-7 text-slate-900 dark:text-slate-200">
              {title}
            </h2>
            {!hideClose && (
              <button
                onClick={handleClose}
                className="text-[22px] text-slate-900 dark:text-slate-200">
                <Icon icon="heroicons-outline:x" />
              </button>
            )}
          </div>
          {subTitle && ( // THÊM SUBTITLE
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {subTitle}
            </div>
          )}
        </div>
      )}

      <div
        className="px-6 py-6"
        style={{
          maxHeight: bodyMaxHeight || "calc(100vh - 160px)",
          overflowY: "auto",
        }}>
        {children}
      </div>

      {footerContent && (
        <div
          className={`px-4 py-3 flex justify-end space-x-3
          ${showDivider ? "border-t border-slate-100 dark:border-slate-700" : ""}`}>
          {footerContent}
        </div>
      )}
    </Dialog.Panel>
  );

  return (
    <>
      {uncontrol ? (
        <>
          <button
            type="button"
            onClick={openModal}
            className={`btn ${labelClass}`}>
            {label}
          </button>

          <Transition appear show={showModal} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-[99999]"
              onClose={!disableBackdrop ? closeModal : returnNull}>
              {!disableBackdrop && (
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0"}
                  enterTo={noFade ? "" : "opacity-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100"}
                  leaveTo={noFade ? "" : "opacity-0"}>
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                </Transition.Child>
              )}

              <div className="fixed inset-0 overflow-y-auto">
                <div
                  className={`flex min-h-full justify-center text-center p-6 ${
                    centered ? "items-center" : "items-start"
                  }`}>
                  <Transition.Child
                    as={Fragment}
                    enter={noFade ? "" : "duration-300 ease-out"}
                    enterFrom={noFade ? "" : "opacity-0 scale-95"}
                    enterTo={noFade ? "" : "opacity-100 scale-100"}
                    leave={noFade ? "" : "duration-200 ease-in"}
                    leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                    leaveTo={noFade ? "" : "opacity-0 scale-95"}>
                    {renderContent(closeModal)}
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      ) : (
        <Transition appear show={activeModal} as={Fragment}>
          <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
            {!disableBackdrop && (
              <Transition.Child
                as={Fragment}
                enter={noFade ? "" : "duration-300 ease-out"}
                enterFrom={noFade ? "" : "opacity-0"}
                enterTo={noFade ? "" : "opacity-100"}
                leave={noFade ? "" : "duration-200 ease-in"}
                leaveFrom={noFade ? "" : "opacity-100"}
                leaveTo={noFade ? "" : "opacity-0"}>
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
              </Transition.Child>
            )}

            <div className="fixed inset-0 overflow-y-auto">
              <div
                className={`flex min-h-full justify-center text-center p-6 ${
                  centered ? "items-center" : "items-start"
                }`}>
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0 scale-95"}
                  enterTo={noFade ? "" : "opacity-100 scale-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                  leaveTo={noFade ? "" : "opacity-0 scale-95"}>
                  {renderContent(onClose)}
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default Modal;
