import toast from "react-hot-toast";

export const showLoading = (msg) => toast.loading(msg);
export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);
export const dismiss = () => toast.dismiss();
