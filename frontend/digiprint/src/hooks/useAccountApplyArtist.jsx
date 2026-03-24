import { useCallback, useEffect, useState } from "react";
import ProfileService from "../services/ProfileService";

export function useAccountApplyArtist(isAuthenticated, role) {
    const [applyModal, setApplyModal] = useState(false);
    const [applyReason, setApplyReason] = useState("");
    const [applySubmitting, setApplySubmitting] = useState(false);
    const [latestApplication, setLatestApplication] = useState(null);
    const [applicationLoading, setApplicationLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || role !== "USER") {
            setLatestApplication(null);
            setApplicationLoading(false);
            return;
        }
        let cancelled = false;
        setApplicationLoading(true);
        ProfileService.getMyArtistApplication()
            .then((res) => {
                if (cancelled) return;
                if (res.status === 204 || !res.data) {
                    setLatestApplication(null);
                } else {
                    setLatestApplication(res.data);
                }
            })
            .catch(() => {
                if (!cancelled) setLatestApplication(null);
            })
            .finally(() => {
                if (!cancelled) setApplicationLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, role]);

    const openApplyModal = useCallback(() => {
        setApplyReason("");
        setApplyModal(true);
    }, []);

    const closeApplyModal = useCallback(() => {
        if (!applySubmitting) setApplyModal(false);
    }, [applySubmitting]);

    const submitApplyArtist = useCallback(
        async (e) => {
            e.preventDefault();
            const text = applyReason.trim();
            if (!text) return;
            setApplySubmitting(true);
            try {
                await ProfileService.applyToArtist(text);
                const res = await ProfileService.getMyArtistApplication();
                if (res.status === 200 && res.data) {
                    setLatestApplication(res.data);
                }
                setApplyModal(false);
                setApplyReason("");
            } catch {
                // Keep silent, axios interceptor handles toast if configured.
            } finally {
                setApplySubmitting(false);
            }
        },
        [applyReason]
    );

    return {
        applyModal,
        applyReason,
        setApplyReason,
        applySubmitting,
        latestApplication,
        applicationLoading,
        openApplyModal,
        closeApplyModal,
        submitApplyArtist,
    };
}

