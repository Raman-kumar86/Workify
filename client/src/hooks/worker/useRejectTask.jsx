import { useState } from 'react';
import axiosInstance from '../../api/axios';

const useRejectTask = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const rejectTask = async (taskId, reason) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post(`/api/worker/tasks/${taskId}/reject`, { reason });
            setLoading(false);
            return response.data;
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || "Failed to reject task");
            throw err;
        }
    };

    return { rejectTask, loading, error };
};

export default useRejectTask;
