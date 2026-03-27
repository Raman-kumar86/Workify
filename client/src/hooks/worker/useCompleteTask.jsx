import { useState } from 'react';
import axiosInstance from '../../api/axios';

const useCompleteTask = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const completeTask = async (taskId, workSummary = "") => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post(`/api/worker/tasks/${taskId}/complete`, { workSummary });
            setLoading(false);
            return response.data;
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || "Failed to complete task");
            throw err;
        }
    };

    return { completeTask, loading, error };
};

export default useCompleteTask;
