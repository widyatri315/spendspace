import React from "react";

const PopupModal = ({ open, name }) => {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="modalContainer cursor-pointer">
        <div className="modalRight">
          <p className="closeBtn">X</p>
         <div class="p-4 md:p-5 text-center">
                <svg class="mx-auto mb-4 text-fg-disabled w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                <h3 class="mb-6 text-body">Hi {name}</h3>
                <p class="mb-6 text-gray-500">Your details have been submitted successfully. You can now proceed to use SpendSpace.</p>
                <div class="flex justify-center items-center space-x-4">
                   
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
