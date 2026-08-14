import { toast } from "sonner";

export const showLoading = (msg) => toast.loading(msg);
export const showSuccess = (msg) =>{console.log(msg , "From taostify");  toast.success(msg, { position: "top-center" });}
export const showError = (msg) => toast.error(msg, { position: "top-center" });
export const dismiss = () => toast.dismiss();
