import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
    coords: GeolocationCoordinates | null;
    error: GeolocationPositionError | null;
    permissionStatus: PermissionState | 'unknown';
}

export function useLocationState() {
    const [location, setLocation] = useState<LocationState>({
        coords: null,
        error: null,
        permissionStatus: 'unknown'
    });
    const { toast } = useToast();

    const requestLocation = () => {
        if (!("geolocation" in navigator)) {
            toast({
                title: "Not Supported",
                description: "Geolocation is not supported by your browser.",
                variant: "destructive"
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    coords: position.coords,
                    error: null,
                    permissionStatus: 'granted'
                });
                localStorage.setItem("location_prompt_seen", "true");
            },
            (error) => {
                setLocation(prev => ({ ...prev, error, permissionStatus: 'denied' }));
                // Don't set "prompt seen" if denied, so we can re-prompt with custom UI
            }
        );
    };

    useEffect(() => {
        // Check permission status if available (Permissions API)
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setLocation(prev => ({ ...prev, permissionStatus: result.state }));

                result.onchange = () => {
                    setLocation(prev => ({ ...prev, permissionStatus: result.state }));
                };
            });
        }

        // Auto-check if we previously had access
        if (localStorage.getItem("location_prompt_seen") === "true") {
            requestLocation();
        }
    }, []);

    return { location, requestLocation };
}
