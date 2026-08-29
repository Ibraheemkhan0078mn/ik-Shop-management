import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const Alert = ({ 
    msg, 
    type = 'info', 
    onConfirm, 
    onCancel, 
    confirmText = 'OK', 
    cancelText = 'Cancel',
    showCancel = true,
    isVisible = true 
}) => {
    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'error': return <AlertTriangle className="text-red-500" size={24} />;
            case 'success': return <CheckCircle className="text-green-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-orange-500" size={24} />;
            default: return <Info className="text-blue-500" size={24} />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'error': return 'border-red-200';
            case 'success': return 'border-green-200';
            case 'warning': return 'border-orange-200';
            default: return 'border-blue-200';
        }
    };

    return (
        <div className='fixed inset-0 z-50 backdrop-blur-sm flex justify-center items-center' style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className={`max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl border-2 ${getBorderColor()}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h3 className="font-semibold text-gray-900">
                            {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Information'}
                        </h3>
                    </div>
                    {onCancel && (
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{msg}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-2xl">
                    {showCancel && onCancel && (
                        <button 
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Alert