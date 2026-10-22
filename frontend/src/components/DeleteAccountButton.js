import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const DeleteAccountButton = () => {
    const { deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to permanently delete your KhajurKart account? This action cannot be undone.'
        );

        if (!confirmed) return;

        setDeleting(true);

        try {
            await deleteAccount();
            toast.success('Your account has been deleted.');
            navigate('/', { replace: true });
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                error.message ||
                'Unable to delete your account. Please try again.'
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full rounded-sm border border-red-600 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
            {deleting ? 'Deleting Account…' : 'Delete My Account'}
        </button>
    );
};

export default DeleteAccountButton;
